export interface User {
  id: string;
  wallet_address: string;
  user_type: 'seller' | 'investor' | 'both';
  email?: string;
  company_name?: string;
  did?: string;
  kyc_verified: boolean;
  credit_score: number;
  total_invoices: number;
  on_time_payments: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  seller_id: string;
  buyer_name: string;
  buyer_did?: string;
  amount: number;
  currency: string;
  due_date: string;
  discount_rate: number;
  selling_price: number;
  status: 'pending' | 'listed' | 'funded' | 'completed' | 'defaulted';
  nft_token_id?: string;
  document_hash?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  seller_company?: string;
  seller_credit_score?: number;
  days_until_due?: number;
  roi_percentage?: number;
}

export interface Transaction {
  id: string;
  invoice_id: string;
  investor_id: string;
  amount: number;
  transaction_type: 'purchase' | 'payment' | 'refund';
  xrpl_tx_hash?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface Escrow {
  id: string;
  invoice_id: string;
  investor_id: string;
  amount: number;
  escrow_sequence?: number;
  xrpl_escrow_id?: string;
  finish_after: string;
  status: 'active' | 'released' | 'cancelled';
  created_at: string;
  released_at?: string;
}

export interface WalletInfo {
  address: string;
  seed: string;
  publicKey: string;
}

export interface MarketplaceFilters {
  minAmount?: number;
  maxAmount?: number;
  minROI?: number;
  maxROI?: number;
  creditScore?: number;
  sortBy?: 'roi_desc' | 'roi_asc' | 'amount_desc' | 'amount_asc' | 'due_date' | 'credit_score';
}