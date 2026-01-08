import express, { Request, Response } from 'express';
import { pool } from '../server';

const router = express.Router();

// Get escrow by invoice ID
router.get('/invoice/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;

    const result = await pool.query(
      `SELECT e.*, u.wallet_address as investor_wallet, u.company_name as investor_company
       FROM escrows e
       JOIN users u ON e.investor_id = u.id
       WHERE e.invoice_id = $1`,
      [invoiceId]
    );

    res.json({
      success: true,
      escrows: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all escrows by investor
router.get('/investor/:investorId', async (req: Request, res: Response) => {
  try {
    const { investorId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT e.*, i.invoice_number, i.amount as invoice_amount, i.due_date, i.status as invoice_status
      FROM escrows e
      JOIN invoices i ON e.invoice_id = i.id
      WHERE e.investor_id = $1
    `;
    const params: any[] = [investorId];

    if (status) {
      query += ' AND e.status = $2';
      params.push(status);
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      escrows: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching investor escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get escrow statistics
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_escrows,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE status = 'active') as active_escrows,
        COUNT(*) FILTER (WHERE status = 'released') as released_escrows,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_escrows
       FROM escrows
       WHERE investor_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      stats: stats.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching escrow stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;