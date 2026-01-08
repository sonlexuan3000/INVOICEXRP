import express, { Request, Response } from 'express';
import { pool } from '../server';
import xrplService from '../services/xrpl.service';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create new invoice
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      invoiceNumber,
      sellerId,
      buyerName,
      buyerDID,
      amount,
      dueDate,
      discountRate,
      documentHash,
      issuerSeed,
    } = req.body;

    // Validate input
    if (!invoiceNumber || !sellerId || !buyerName || !amount || !dueDate || !discountRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate selling price
    const sellingPrice = amount * (1 - discountRate / 100);

    // Get seller info
    const sellerResult = await pool.query('SELECT * FROM users WHERE id = $1', [sellerId]);
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    const seller = sellerResult.rows[0];

    // Mint NFT on XRPL
    const nftResult = await xrplService.mintInvoiceNFT({
      issuerSeed: issuerSeed || process.env.XRPL_ISSUER_SEED!,
      invoiceData: {
        invoiceNumber,
        amount,
        dueDate,
        sellerDID: seller.did,
        buyerName,
        documentHash: documentHash || 'QmHash123',
      },
    });

    // Insert into database
    const invoiceId = uuidv4();
    const insertResult = await pool.query(
      `INSERT INTO invoices 
        (id, invoice_number, seller_id, buyer_name, buyer_did, amount, due_date, 
         discount_rate, selling_price, status, nft_token_id, document_hash, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        invoiceId,
        invoiceNumber,
        sellerId,
        buyerName,
        buyerDID,
        amount,
        dueDate,
        discountRate,
        sellingPrice,
        'listed',
        nftResult.nftTokenId,
        documentHash || 'QmHash123',
        JSON.stringify(nftResult.metadata),
      ]
    );

    res.status(201).json({
      success: true,
      invoice: insertResult.rows[0],
      nft: nftResult,
    });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices by seller
router.get('/seller/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;
    const { status } = req.query;

    let query = 'SELECT * FROM invoices WHERE seller_id = $1';
    const params: any[] = [sellerId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      invoices: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, u.company_name as seller_company, u.credit_score as seller_credit_score
       FROM invoices i
       JOIN users u ON i.seller_id = u.id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      invoice: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update invoice status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'listed', 'funded', 'completed', 'defaulted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      invoice: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment received (for escrow release)
router.post('/:id/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { finisherSeed } = req.body;

    // Get invoice details
    const invoiceResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoiceResult.rows[0];

    // Get escrow details
    const escrowResult = await pool.query(
      'SELECT * FROM escrows WHERE invoice_id = $1 AND status = $2',
      [id, 'active']
    );
    if (escrowResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active escrow found' });
    }
    const escrow = escrowResult.rows[0];

    // Get investor wallet address
    const investorResult = await pool.query('SELECT * FROM users WHERE id = $1', [
      escrow.investor_id,
    ]);
    const investor = investorResult.rows[0];

    // Release escrow on XRPL
    const releaseResult = await xrplService.finishEscrow({
      finisherSeed: finisherSeed || process.env.XRPL_ISSUER_SEED!,
      owner: investor.wallet_address,
      sequence: escrow.escrow_sequence,
    });

    // Update escrow status
    await pool.query(
      'UPDATE escrows SET status = $1, released_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['released', escrow.id]
    );

    // Update invoice status
    await pool.query(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', id]
    );

    // Record credit history
    await pool.query(
      `INSERT INTO credit_history (user_id, invoice_id, payment_status, score_change)
       VALUES ($1, $2, $3, $4)`,
      [invoice.seller_id, id, 'on_time', 10]
    );

    // Update seller's payment stats
    await pool.query(
      `UPDATE users 
       SET total_invoices = total_invoices + 1,
           on_time_payments = on_time_payments + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [invoice.seller_id]
    );

    res.json({
      success: true,
      message: 'Payment confirmed and escrow released',
      releaseResult,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoice statistics for seller
router.get('/stats/:sellerId', async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'funded' THEN 1 ELSE 0 END) as funded_invoices,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_invoices,
        SUM(amount) as total_amount,
        SUM(selling_price) as total_funded,
        AVG(discount_rate) as avg_discount_rate
       FROM invoices
       WHERE seller_id = $1`,
      [sellerId]
    );

    res.json({
      success: true,
      stats: stats.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;