import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  LogOut,
  TrendingUp,
  Award,
} from 'lucide-react';
import { getSellerInvoices, getInvoiceStats } from '../services/api';
import type { User, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function SellerDashboard({ user, onLogout }: Props) {
  const [filter, setFilter] = useState<string>('all');

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['seller-invoices', user.id, filter],
    queryFn: () => getSellerInvoices(user.id, filter === 'all' ? undefined : filter),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['seller-stats', user.id],
    queryFn: () => getInvoiceStats(user.id),
  });

  const invoices = invoicesData?.invoices || [];
  const stats = statsData?.stats || {};
  const isLoading = invoicesLoading || statsLoading;

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'badge badge-warning',
      listed: 'badge badge-info',
      funded: 'badge badge-success',
      completed: 'badge badge-success',
      defaulted: 'badge badge-danger',
    };
    return badges[status] || 'badge';
  };

  const getCreditRating = (score: number) => {
    if (score >= 95) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 90) return { grade: 'A', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600' };
    return { grade: 'D', color: 'text-red-600' };
  };

  const creditRating = getCreditRating(user.credit_score);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold">InvoiceXRP</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Seller
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/marketplace" className="text-gray-600 hover:text-gray-900">
                Marketplace
              </Link>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.company_name || 'Seller'}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
                <p className="text-2xl font-bold">{stats.total_invoices || 0}</p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Funded</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.total_funded || 0)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Discount</p>
                <p className="text-2xl font-bold">
                    {Number(stats.avg_discount_rate || 0).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Credit Score</p>
                <p className={`text-2xl font-bold ${creditRating.color}`}>
                  {creditRating.grade} ({user.credit_score})
                </p>
              </div>
              <Award className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('listed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'listed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Listed
            </button>
            <button
              onClick={() => setFilter('funded')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'funded' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Funded
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Completed
            </button>
          </div>

          <Link to="/create-invoice" className="btn btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Invoice</span>
          </Link>
        </div>

        {/* Invoices Table */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Your Invoices</h2>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No invoices yet</p>
              <Link to="/create-invoice" className="btn btn-primary">
                Create Your First Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Buyer</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">
                      You Receive
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invoice.invoice_number}</td>
                      <td className="py-3 px-4">{invoice.buyer_name}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(invoice.selling_price)}
                      </td>
                      <td className="py-3 px-4">{formatDate(invoice.due_date)}</td>
                      <td className="py-3 px-4">
                        <span className={getStatusBadge(invoice.status)}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/invoice/${invoice.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}