import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, TrendingUp, Calendar, Award } from 'lucide-react';
import { getMarketplaceInvoices, purchaseInvoice } from '../services/api';
import type { User, Invoice } from '../types';
import { formatCurrency, formatDate, calculateROI, calculateDaysUntilDue } from '../utils/format';
import SeedPromptModal from '../components/SeedPromptModal';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function Marketplace({ user }: Props) {
  const [sortBy, setSortBy] = useState('roi_desc');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ['marketplace', sortBy, minAmount, maxAmount],
    queryFn: () =>
      getMarketplaceInvoices({
        sortBy,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      }),
  });

  const invoices = data?.invoices || [];

  const handlePurchase = async (invoice: Invoice) => {
    if (!confirm(`Purchase invoice ${invoice.invoice_number} for ${formatCurrency(invoice.selling_price)}?`)) {
      return;
    }

    // Check if seed exists
    const userSeed = localStorage.getItem(`wallet_seed_${user.id}`);
    
    if (!userSeed) {
      // Prompt for seed
      setPendingInvoice(invoice);
      setShowSeedModal(true);
      return;
    }

    // Proceed with purchase
    await executePurchase(invoice, userSeed);
  };

  const executePurchase = async (invoice: Invoice, seed: string) => {
    setPurchasing(invoice.id);
    try {
      await purchaseInvoice({
        invoiceId: invoice.id,
        investorId: user.id,
        investorSeed: seed,
      });
      
      // Save seed for future use
      localStorage.setItem(`wallet_seed_${user.id}`, seed);
      
      alert('Invoice purchased successfully!');
      refetch();
    } catch (error: any) {
      console.error('Purchase error:', error);
      alert(error.response?.data?.error || 'Failed to purchase invoice');
    } finally {
      setPurchasing(null);
      setShowSeedModal(false);
      setPendingInvoice(null);
    }
  };

  const handleSeedSubmit = (seed: string) => {
    if (pendingInvoice) {
      executePurchase(pendingInvoice, seed);
    }
  };

  const getCreditBadge = (score: number) => {
    if (score >= 90) return { text: 'A', color: 'bg-green-100 text-green-700' };
    if (score >= 80) return { text: 'B', color: 'bg-blue-100 text-blue-700' };
    if (score >= 70) return { text: 'C', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'D', color: 'bg-red-100 text-red-700' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to={user.user_type === 'seller' ? '/seller' : '/investor'}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="text-xl font-bold">Invoice Marketplace</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input">
                <option value="roi_desc">Highest ROI</option>
                <option value="roi_asc">Lowest ROI</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="due_date">Due Date</option>
                <option value="credit_score">Credit Score</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="1000000"
                className="input"
              />
            </div>

            <button onClick={() => refetch()} className="btn btn-primary">
              <Filter className="w-5 h-5 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Invoices Grid */}
        {invoices.length === 0 ? (
          <div className="card text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No invoices found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((invoice: Invoice) => {
              const roi = calculateROI(invoice.amount, invoice.selling_price);
              const daysUntilDue = calculateDaysUntilDue(invoice.due_date);
              const creditBadge = getCreditBadge(invoice.seller_credit_score || 0);

              return (
                <div key={invoice.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{invoice.invoice_number}</h3>
                      <p className="text-sm text-gray-600">{invoice.seller_company}</p>
                    </div>
                    <span className={`badge ${creditBadge.color}`}>
                      <Award className="w-3 h-3 inline mr-1" />
                      {creditBadge.text}
                    </span>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Amount:</span>
                      <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment:</span>
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(invoice.selling_price)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Return:</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(invoice.amount - invoice.selling_price)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600">ROI:</span>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-bold text-green-600 text-lg">{roi.toFixed(2)}%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Due In:</span>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{daysUntilDue} days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {user.user_type === 'investor' || user.user_type === 'both' ? (
                      <button
                        onClick={() => handlePurchase(invoice)}
                        disabled={purchasing === invoice.id}
                        className="btn btn-primary w-full"
                      >
                        {purchasing === invoice.id ? 'Purchasing...' : 'Purchase Invoice'}
                      </button>
                    ) : (
                      <div className="text-center text-sm text-gray-500 py-2">
                        Switch to investor account to purchase
                      </div>
                    )}
                    <Link
                      to={`/invoice/${invoice.id}`}
                      className="block text-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SeedPromptModal
        isOpen={showSeedModal}
        onSubmit={handleSeedSubmit}
        onCancel={() => {
          setShowSeedModal(false);
          setPendingInvoice(null);
        }}
        title="Sign Transaction"
        description="Enter your wallet seed to purchase this invoice"
      />
    </div>
  );
}