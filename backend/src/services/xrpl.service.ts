import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

class XRPLService {
  private client: Client;
  private isConnected: boolean = false;
  private mockMode: boolean;

  constructor() {
    // CRITICAL: Check before client initialization
    const mockEnv = process.env.XRPL_MOCK_MODE;
    this.mockMode = true;
    
    console.log('XRPL Service Init:', {
      XRPL_MOCK_MODE: mockEnv,
      mockMode: this.mockMode
    });
    
    this.client = new Client(process.env.XRPL_NETWORK || 'wss://s.altnet.rippletest.net:51233');
    
    if (this.mockMode) {
      console.log('⚠️  XRPL Mock Mode Enabled - Transactions will be simulated');
    } else {
      console.log('✅ XRPL Live Mode - Real transactions will be executed');
    }
  }

  async connect() {
    if (this.mockMode) return;
    
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Connected to XRPL');
    }
  }

  async disconnect() {
    if (this.mockMode) return;
    
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      console.log('❌ Disconnected from XRPL');
    }
  }

  // Mint NFT for invoice
  async mintInvoiceNFT(params: {
    issuerSeed: string;
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      dueDate: string;
      sellerDID: string;
      buyerName: string;
      documentHash: string;
    };
  }) {
    // Mock mode
    if (this.mockMode) {
      const mockNFTokenId = 'MOCK_NFT_' + Date.now() + Math.random().toString(36).substr(2, 9);
      return {
        success: true,
        txHash: 'MOCK_TX_' + Date.now(),
        nftTokenId: mockNFTokenId,
        metadata: params.invoiceData,
      };
    }
    try {
      await this.connect();

      const wallet = Wallet.fromSeed(params.issuerSeed);

      // Create NFT metadata URI (in production, this would be IPFS)
      const metadata = {
        invoice_number: params.invoiceData.invoiceNumber,
        amount: params.invoiceData.amount,
        due_date: params.invoiceData.dueDate,
        seller_did: params.invoiceData.sellerDID,
        buyer_name: params.invoiceData.buyerName,
        document_hash: params.invoiceData.documentHash,
        minted_at: new Date().toISOString(),
      };

      // Convert metadata to hex
      const metadataHex = Buffer.from(JSON.stringify(metadata)).toString('hex').toUpperCase();

      // Mint NFToken
      const mintTx = await this.client.submitAndWait(
        {
          TransactionType: 'NFTokenMint',
          Account: wallet.address,
          URI: metadataHex,
          Flags: 8, // tfTransferable
          NFTokenTaxon: 0,
        },
        { wallet }
      );

      console.log('NFT Minted:', mintTx.result.hash);

      // Get NFToken ID from transaction metadata
      const nftTokenId = this.extractNFTokenID(mintTx);

      return {
        success: true,
        txHash: mintTx.result.hash,
        nftTokenId,
        metadata,
      };
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  // Create escrow for invoice payment
  async createEscrow(params: {
    senderSeed: string;
    destination: string;
    amount: number; // in RLUSD
    finishAfter: Date;
    invoiceId: string;
  }) {
    // Mock mode
    if (this.mockMode) {
      return {
        success: true,
        txHash: 'MOCK_ESCROW_' + Date.now(),
        sequence: Math.floor(Math.random() * 1000000),
      };
    }
    try {
      await this.connect();

      const wallet = Wallet.fromSeed(params.senderSeed);

      const finishAfterRippleTime = this.dateToRippleTime(params.finishAfter);
      const cancelAfterRippleTime = this.dateToRippleTime(
        new Date(params.finishAfter.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days grace period
      );

      // Create escrow with RLUSD
      const escrowTx = await this.client.submitAndWait(
        {
          TransactionType: 'EscrowCreate',
          Account: wallet.address,
          Destination: params.destination,
          Amount: {
            currency: process.env.RLUSD_CURRENCY || 'RLUSD',
            value: params.amount.toString(),
            issuer: process.env.RLUSD_ISSUER || '',
          } as any,
          FinishAfter: finishAfterRippleTime,
          CancelAfter: cancelAfterRippleTime,
          DestinationTag: 0,
        },
        { wallet }
      );

      console.log('Escrow Created:', escrowTx.result.hash);

      return {
        success: true,
        txHash: escrowTx.result.hash,
        sequence: (escrowTx.result as any).Sequence,
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  // Finish escrow (release funds)
  async finishEscrow(params: {
    finisherSeed: string;
    owner: string;
    sequence: number;
  }) {
    try {
      await this.connect();

      const wallet = Wallet.fromSeed(params.finisherSeed);

      const finishTx = await this.client.submitAndWait(
        {
          TransactionType: 'EscrowFinish',
          Account: wallet.address,
          Owner: params.owner,
          OfferSequence: params.sequence,
        },
        { wallet }
      );

      console.log('Escrow Finished:', finishTx.result.hash);

      return {
        success: true,
        txHash: finishTx.result.hash,
      };
    } catch (error) {
      console.error('Error finishing escrow:', error);
      throw error;
    }
  }

  // Cancel escrow
  async cancelEscrow(params: {
    cancellerSeed: string;
    owner: string;
    sequence: number;
  }) {
    try {
      await this.connect();

      const wallet = Wallet.fromSeed(params.cancellerSeed);

      const cancelTx = await this.client.submitAndWait(
        {
          TransactionType: 'EscrowCancel',
          Account: wallet.address,
          Owner: params.owner,
          OfferSequence: params.sequence,
        },
        { wallet }
      );

      console.log('Escrow Cancelled:', cancelTx.result.hash);

      return {
        success: true,
        txHash: cancelTx.result.hash,
      };
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      throw error;
    }
  }

  // Send RLUSD payment
  async sendRLUSD(params: {
    senderSeed: string;
    destination: string;
    amount: number;
  }) {
    // Mock mode
    if (this.mockMode) {
      return {
        success: true,
        txHash: 'MOCK_PAYMENT_' + Date.now(),
      };
    }
    try {
      await this.connect();

      const wallet = Wallet.fromSeed(params.senderSeed);

      const payment = await this.client.submitAndWait(
        {
          TransactionType: 'Payment',
          Account: wallet.address,
          Destination: params.destination,
          Amount: {
            currency: process.env.RLUSD_CURRENCY || 'RLUSD',
            value: params.amount.toString(),
            issuer: process.env.RLUSD_ISSUER || '',
          },
        },
        { wallet }
      );

      console.log('RLUSD Payment Sent:', payment.result.hash);

      return {
        success: true,
        txHash: payment.result.hash,
      };
    } catch (error) {
      console.error('Error sending RLUSD:', error);
      throw error;
    }
  }

  // Get account balance
  async getBalance(address: string) {
    try {
      await this.connect();

      const response = await this.client.request({
        command: 'account_lines',
        account: address,
      });

      const rlusdBalance = response.result.lines.find(
        (line: any) => line.currency === (process.env.RLUSD_CURRENCY || 'RLUSD')
      );

      return {
        xrp: dropsToXrp(
          (await this.client.request({ command: 'account_info', account: address })).result
            .account_data.Balance
        ),
        rlusd: rlusdBalance ? parseFloat(rlusdBalance.balance) : 0,
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Helper: Convert date to Ripple epoch time
  private dateToRippleTime(date: Date): number {
    const rippleEpoch = 946684800; // January 1, 2000 00:00:00 UTC
    return Math.floor(date.getTime() / 1000) - rippleEpoch;
  }

  // Helper: Extract NFToken ID from mint transaction
  private extractNFTokenID(mintTx: any): string {
    const meta = mintTx.result.meta;
    if (meta && meta.nftoken_id) {
      return meta.nftoken_id;
    }

    // Alternative: parse from CreatedNode
    if (meta && meta.AffectedNodes) {
      for (const node of meta.AffectedNodes) {
        if (node.CreatedNode && node.CreatedNode.LedgerEntryType === 'NFTokenPage') {
          const nfts = node.CreatedNode.NewFields?.NFTokens;
          if (nfts && nfts.length > 0) {
            return nfts[0].NFToken.NFTokenID;
          }
        }
      }
    }

    throw new Error('Could not extract NFToken ID from transaction');
  }

  // Generate new wallet (for testing)
  generateWallet() {
    const wallet = Wallet.generate();
    return {
      address: wallet.address,
      seed: wallet.seed,
      publicKey: wallet.publicKey,
    };
  }

  // Setup RLUSD trustline
  async setupRLUSDTrustline(walletSeed: string) {
    try {
      await this.connect();

      const wallet = Wallet.fromSeed(walletSeed);

      const trustSet = await this.client.submitAndWait(
        {
          TransactionType: 'TrustSet',
          Account: wallet.address,
          LimitAmount: {
            currency: process.env.RLUSD_CURRENCY || 'RLUSD',
            issuer: process.env.RLUSD_ISSUER || 'rN7n7otQDd6FczFgLdlqtyMVrn3yS7Z6Pq',
            value: '1000000000', // Max trust limit
          },
        },
        { wallet }
      );

      console.log('Trustline created:', trustSet.result.hash);

      return {
        success: true,
        txHash: trustSet.result.hash,
      };
    } catch (error) {
      console.error('Error creating trustline:', error);
      throw error;
    }
  }

  // Fund testnet wallet
  async fundTestnetWallet(address: string) {
    try {
      await this.connect();
      await this.client.fundWallet(Wallet.fromSeed(''));
      console.log('Wallet funded on testnet');
    } catch (error) {
      console.error('Error funding wallet:', error);
      throw error;
    }
  }
}

export default new XRPLService();