import express, { Request, Response } from 'express';
import { pool } from '../server';
import xrplService from '../services/xrpl.service';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all listed invoices (marketplace)
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const { minAmount, maxAmount, minROI, maxROI, creditScore, sortBy } = req.query;

    let query = `
      SELECT i.*, 
             u.company_name as seller_company, 
             u.credit_score as seller_credit_score,
             u.total_invoices as seller_total_invoices,
             u.on_time_payments as seller_on_time_payments,
             EXTRACT(DAY FROM (i.due_date::timestamp - CURRENT_TIMESTAMP)) as days_until_due,
             (i.amount - i.selling_price) / i.selling_price * 100 as roi_percentage
      FROM invoices i
      JOIN users u ON i.seller_id = u.id
      WHERE i.status = 'listed'
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (minAmount) {
      paramCount++;
      query += ` AND i.amount >= $${paramCount}`;
      params.push(minAmount);
    }

    if (maxAmount) {
      paramCount++;
      query += ` AND i.amount <= $${paramCount}`;
      params.push(maxAmount);
    }

    if (creditScore) {
      paramCount++;
      query += ` AND u.credit_score >= $${paramCount}`;
      params.push(creditScore);
    }

    // Sorting
    switch (sortBy) {
      case 'roi_desc':
        query += ' ORDER BY roi_percentage DESC';
        break;
      case 'roi_asc':
        query += ' ORDER BY roi_percentage ASC';
        break;
      case 'amount_desc':
        query += ' ORDER BY i.amount DESC';
        break;
      case 'amount_asc':
        query += ' ORDER BY i.amount ASC';
        break;
      case 'due_date':
        query += ' ORDER BY i.due_date ASC';
        break;
      case 'credit_score':
        query += ' ORDER BY u.credit_score DESC';
        break;
      default:
        query += ' ORDER BY i.created_at DESC';
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      invoices: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error('Error fetching marketplace invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Purchase invoice
router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const { invoiceId, investorId, investorSeed } = req.body;

    if (!invoiceId || !investorId || !investorSeed) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get invoice details
    const invoiceResult = await pool.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    const invoice = invoiceResult.rows[0];

    if (invoice.status !== 'listed') {
      return res.status(400).json({ error: 'Invoice is not available for purchase' });
    }

    // Get seller and investor info
    const sellerResult = await pool.query('SELECT * FROM users WHERE id = $1', [invoice.seller_id]);
    const investorResult = await pool.query('SELECT * FROM users WHERE id = $1', [investorId]);

    if (sellerResult.rows.length === 0 || investorResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const seller = sellerResult.rows[0];
    const investor = investorResult.rows[0];

    // Step 1: Send RLUSD to seller
    const paymentResult = await xrplService.sendRLUSD({
      senderSeed: investorSeed,
      destination: seller.wallet_address,
      amount: invoice.selling_price,
    });

    // Step 2: Create escrow for full amount (to be released when invoice is paid)
    const escrowResult = await xrplService.createEscrow({
      senderSeed: investorSeed,
      destination: investor.wallet_address,
      amount: invoice.amount,
      finishAfter: new Date(invoice.due_date),
      invoiceId: invoice.id,
    });

    // Step 3: Record transaction
    const transactionId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, invoice_id, investor_id, amount, transaction_type, xrpl_tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [transactionId, invoiceId, investorId, invoice.selling_price, 'purchase', paymentResult.txHash, 'completed']
    );

    // Step 4: Record escrow
    const escrowId = uuidv4();
    await pool.query(
      `INSERT INTO escrows (id, invoice_id, investor_id, amount, escrow_sequence, xrpl_escrow_id, finish_after, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        escrowId,
        invoiceId,
        investorId,
        invoice.amount,
        escrowResult.sequence,
        escrowResult.txHash,
        invoice.due_date,
        'active',
      ]
    );

    // Step 5: Update invoice status
    await pool.query(
      'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['funded', invoiceId]
    );

    res.json({
      success: true,
      message: 'Invoice purchased successfully',
      transaction: {
        paymentTxHash: paymentResult.txHash,
        escrowTxHash: escrowResult.txHash,
        escrowSequence: escrowResult.sequence,
      },
    });
  } catch (error: any) {
    console.error('Error purchasing invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get marketplace statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_listed,
        SUM(amount) as total_value,
        AVG(discount_rate) as avg_discount,
        AVG((amount - selling_price) / selling_price * 100) as avg_roi,
        MIN(EXTRACT(DAY FROM (due_date::timestamp - CURRENT_TIMESTAMP))) as min_days_until_due,
        MAX(EXTRACT(DAY FROM (due_date::timestamp - CURRENT_TIMESTAMP))) as max_days_until_due
      FROM invoices
      WHERE status = 'listed'
    `);

    const categoryStats = await pool.query(`
      SELECT 
        CASE 
          WHEN amount < 10000 THEN 'small'
          WHEN amount < 50000 THEN 'medium'
          ELSE 'large'
        END as category,
        COUNT(*) as count,
        AVG((amount - selling_price) / selling_price * 100) as avg_roi
      FROM invoices
      WHERE status = 'listed'
      GROUP BY category
    `);

    res.json({
      success: true,
      overall: stats.rows[0],
      byCategory: categoryStats.rows,
    });
  } catch (error: any) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get investor portfolio
router.get('/portfolio/:investorId', async (req: Request, res: Response) => {
  try {
    const { investorId } = req.params;

    const portfolio = await pool.query(
      `SELECT 
        i.*,
        t.amount as invested_amount,
        t.xrpl_tx_hash as purchase_tx,
        e.status as escrow_status,
        e.xrpl_escrow_id,
        EXTRACT(DAY FROM (i.due_date::timestamp - CURRENT_TIMESTAMP)) as days_until_due,
        (i.amount - t.amount) as expected_profit,
        ((i.amount - t.amount) / t.amount * 100) as roi_percentage
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.id
       LEFT JOIN escrows e ON e.invoice_id = i.id AND e.investor_id = t.investor_id
       WHERE t.investor_id = $1 AND t.transaction_type = 'purchase'
       ORDER BY t.created_at DESC`,
      [investorId]
    );

    const summary = await pool.query(
      `SELECT 
        COUNT(*) as total_investments,
        SUM(t.amount) as total_invested,
        SUM(CASE WHEN i.status = 'completed' THEN i.amount ELSE 0 END) as total_returned,
        SUM(CASE WHEN i.status = 'completed' THEN (i.amount - t.amount) ELSE 0 END) as total_profit,
        AVG(CASE WHEN i.status = 'completed' THEN ((i.amount - t.amount) / t.amount * 100) ELSE NULL END) as avg_roi
       FROM transactions t
       JOIN invoices i ON t.invoice_id = i.id
       WHERE t.investor_id = $1 AND t.transaction_type = 'purchase'`,
      [investorId]
    );

    res.json({
      success: true,
      portfolio: portfolio.rows,
      summary: summary.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;