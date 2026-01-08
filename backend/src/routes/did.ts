import express, { Request, Response } from 'express';
import { pool } from '../server';

const router = express.Router();

// Create/Register DID
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { userId, walletAddress, metadata } = req.body;

    if (!userId || !walletAddress) {
      return res.status(400).json({ error: 'User ID and wallet address required' });
    }

    // Generate DID
    const did = `did:xrpl:${walletAddress}`;

    // Update user with DID
    const result = await pool.query(
      'UPDATE users SET did = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [did, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      did,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error registering DID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resolve DID (get user info from DID)
router.get('/resolve/:did', async (req: Request, res: Response) => {
  try {
    const { did } = req.params;

    const result = await pool.query(
      'SELECT id, wallet_address, user_type, company_name, did, kyc_verified, credit_score FROM users WHERE did = $1',
      [did]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'DID not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error resolving DID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify DID ownership (simple challenge-response)
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { did, walletAddress, signature } = req.body;

    // In production, verify signature with XRPL wallet
    // For MVP, we'll do simple verification
    const expectedDID = `did:xrpl:${walletAddress}`;

    if (did !== expectedDID) {
      return res.status(400).json({ error: 'DID does not match wallet address' });
    }

    res.json({
      success: true,
      verified: true,
      message: 'DID verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying DID:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;