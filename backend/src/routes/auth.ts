import express, { Request, Response } from 'express';
import { pool } from '../server';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Register/Connect wallet
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { walletAddress, userType, email, companyName } = req.body;

    if (!walletAddress || !userType) {
      return res.status(400).json({ error: 'Wallet address and user type required' });
    }

    // Check if user already exists
    let result = await pool.query('SELECT * FROM users WHERE wallet_address = $1', [walletAddress]);

    let user;
    if (result.rows.length > 0) {
      // User exists, return existing user
      user = result.rows[0];
    } else {
      // Create new user
      const userId = uuidv4();
      const did = `did:xrpl:${walletAddress}`;

      result = await pool.query(
        `INSERT INTO users (id, wallet_address, user_type, email, company_name, did)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, walletAddress, userType, email, companyName, did]
      );
      user = result.rows[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.wallet_address },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user,
      token,
    });
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update KYC status
router.patch('/kyc/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { kycVerified } = req.body;

    const result = await pool.query(
      'UPDATE users SET kyc_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [kycVerified, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating KYC:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get credit score and history
router.get('/credit/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const historyResult = await pool.query(
      `SELECT ch.*, i.invoice_number, i.amount
       FROM credit_history ch
       JOIN invoices i ON ch.invoice_id = i.id
       WHERE ch.user_id = $1
       ORDER BY ch.recorded_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json({
      success: true,
      creditScore: userResult.rows[0].credit_score,
      totalInvoices: userResult.rows[0].total_invoices,
      onTimePayments: userResult.rows[0].on_time_payments,
      history: historyResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching credit info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify JWT token (middleware)
export const verifyToken = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default router;