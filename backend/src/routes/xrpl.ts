import express, { Request, Response } from 'express';
import xrplService from '../services/xrpl.service';

const router = express.Router();

// Generate new XRPL wallet
router.get('/generate-wallet', (req: Request, res: Response) => {
  try {
    const wallet = xrplService.generateWallet();
    
    res.json({
      success: true,
      wallet,
      warning: 'Save these credentials securely! Never share your seed.',
    });
  } catch (error: any) {
    console.error('Error generating wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get balance
router.get('/balance/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const balance = await xrplService.getBalance(address);
    
    res.json({
      success: true,
      address,
      balance,
    });
  } catch (error: any) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fund testnet wallet (only works on testnet)
router.post('/fund-wallet', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    // Note: This only works on testnet
    await xrplService.fundTestnetWallet(address);
    
    res.json({
      success: true,
      message: 'Wallet funded with testnet XRP',
      address,
    });
  } catch (error: any) {
    console.error('Error funding wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup RLUSD trustline
router.post('/setup-trustline', async (req: Request, res: Response) => {
  try {
    const { walletSeed } = req.body;
    
    if (!walletSeed) {
      return res.status(400).json({ error: 'Wallet seed required' });
    }

    // Will implement in xrpl.service
    const result = await xrplService.setupRLUSDTrustline(walletSeed);
    
    res.json({
      success: true,
      message: 'RLUSD trustline created',
      result,
    });
  } catch (error: any) {
    console.error('Error setting up trustline:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;