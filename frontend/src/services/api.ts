import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth
export const connectWallet = async (data: {
  walletAddress: string;
  userType: 'seller' | 'investor' | 'both';
  email?: string;
  companyName?: string;
}) => {
  const response = await api.post('/auth/connect', data);
  return response.data;
};

export const getProfile = async (userId: string) => {
  const response = await api.get(`/auth/profile/${userId}`);
  return response.data;
};

export const getCreditScore = async (userId: string) => {
  const response = await api.get(`/auth/credit/${userId}`);
  return response.data;
};

// XRPL
export const generateWallet = async () => {
  const response = await api.get('/xrpl/generate-wallet');
  return response.data;
};

export const getBalance = async (address: string) => {
  const response = await api.get(`/xrpl/balance/${address}`);
  return response.data;
};

// Invoices
export const createInvoice = async (data: {
  invoiceNumber: string;
  sellerId: string;
  buyerName: string;
  buyerDID?: string;
  amount: number;
  dueDate: string;
  discountRate: number;
  documentHash?: string;
  issuerSeed: string;
}) => {
  const response = await api.post('/invoices/create', data);
  return response.data;
};

export const getSellerInvoices = async (sellerId: string, status?: string) => {
  const response = await api.get(`/invoices/seller/${sellerId}`, {
    params: { status },
  });
  return response.data;
};

export const getInvoice = async (id: string) => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const confirmPayment = async (invoiceId: string, finisherSeed: string) => {
  const response = await api.post(`/invoices/${invoiceId}/confirm-payment`, {
    finisherSeed,
  });
  return response.data;
};

export const getInvoiceStats = async (sellerId: string) => {
  const response = await api.get(`/invoices/stats/${sellerId}`);
  return response.data;
};

// Marketplace
export const getMarketplaceInvoices = async (filters?: {
  minAmount?: number;
  maxAmount?: number;
  minROI?: number;
  maxROI?: number;
  creditScore?: number;
  sortBy?: string;
}) => {
  const response = await api.get('/marketplace/invoices', { params: filters });
  return response.data;
};

export const purchaseInvoice = async (data: {
  invoiceId: string;
  investorId: string;
  investorSeed: string;
}) => {
  const response = await api.post('/marketplace/purchase', data);
  return response.data;
};

export const getInvestorPortfolio = async (investorId: string) => {
  const response = await api.get(`/marketplace/portfolio/${investorId}`);
  return response.data;
};

export const getMarketplaceStats = async () => {
  const response = await api.get('/marketplace/stats');
  return response.data;
};

// Escrow
export const getInvoiceEscrows = async (invoiceId: string) => {
  const response = await api.get(`/escrow/invoice/${invoiceId}`);
  return response.data;
};

export const getInvestorEscrows = async (investorId: string, status?: string) => {
  const response = await api.get(`/escrow/investor/${investorId}`, {
    params: { status },
  });
  return response.data;
};

export const getEscrowStats = async (userId: string) => {
  const response = await api.get(`/escrow/stats/${userId}`);
  return response.data;
};

export default api;