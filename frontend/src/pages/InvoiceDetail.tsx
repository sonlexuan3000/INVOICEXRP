import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, DollarSign, User as UserIcon, Shield, CheckCircle } from 'lucide-react';
import { getInvoice, confirmPayment } from '../services/api';
import type { User } from '../types';
import { formatCurrency, formatDate, formatAddress } from '../utils/format';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function InvoiceDetail({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  });

  const invoice = data?.invoice;

  const handleConfirmPayment = async () => {
    if (!confirm('Confirm that buyer has paid this invoice?')) return;

    const userSeed = localStorage.getItem(`wallet_seed_${user.id}`);
    
    if (!userSeed) {
      alert('Wallet seed not found. Please reconnect your wallet.');
      return;
    }

    setConfirming(true);
    try {
      await confirmPayment(id!, userSeed);
      alert('Payment confirmed! Escrow released to investor.');
      refetch();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to confirm payment');
    } finally {
      setConfirming(false);
    }
  };

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      listed: 'bg-blue-100 text-blue-800',
      funded: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      defaulted: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const roi = ((invoice.amount - invoice.selling_price) / invoice.selling_price * 100).toFixed(2);
  const isSeller = invoice.seller_id === user.id;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{invoice.invoice_number}</h1>
              <p className="text-gray-600">Invoice Details</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(invoice.status)}`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Seller</h3>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">{invoice.seller_company || 'Unknown'}</span>
              </div>
              {invoice.seller_credit_score !== undefined && (
                <div className="flex items-center space-x-2 mt-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Credit Score: {invoice.seller_credit_score}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Buyer</h3>
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">{invoice.buyer_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Financial Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Invoice Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(invoice.amount)}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Discount Rate</span>
              <span className="text-lg font-semibold text-orange-600">{invoice.discount_rate}%</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Selling Price</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.selling_price)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">Expected Return</span>
              <span className="text-2xl font-bold text-green-600">
                +{formatCurrency(invoice.amount - invoice.selling_price)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">ROI</span>
              <span className="text-2xl font-bold text-green-600">{roi}%</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Timeline</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-semibold">Created</p>
                <p className="text-sm text-gray-600">{formatDate(invoice.created_at)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-semibold">Due Date</p>
                <p className="text-sm text-gray-600">{formatDate(invoice.due_date)}</p>
              </div>
            </div>

            {invoice.status === 'completed' && (
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-semibold">Completed</p>
                  <p className="text-sm text-gray-600">{formatDate(invoice.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Details */}
        {invoice.nft_token_id && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Blockchain Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">NFT Token ID</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {formatAddress(invoice.nft_token_id, 20, 20)}
                </p>
              </div>
              {invoice.document_hash && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Document Hash (IPFS)</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {invoice.document_hash}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {isSeller && invoice.status === 'funded' && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-bold mb-2">Payment Confirmation Required</h3>
            <p className="text-sm text-gray-700 mb-4">
              Once the buyer has paid the invoice amount, confirm the payment to release escrow to the
              investor.
            </p>
            <button
              onClick={handleConfirmPayment}
              disabled={confirming}
              className="btn btn-primary"
            >
              {confirming ? 'Confirming...' : 'Confirm Payment Received'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}