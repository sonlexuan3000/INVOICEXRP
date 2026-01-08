import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Clock, LogOut, Wallet } from 'lucide-react';
import { getInvestorPortfolio, getMarketplaceStats } from '../services/api';
import type { User } from '../types';
import { formatCurrency, formatDate, formatPercentage } from '../utils/format';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function InvestorDashboard({ user, onLogout }: Props) {
  const { data: portfolioData } = useQuery({
    queryKey: ['investor-portfolio', user.id],
    queryFn: () => getInvestorPortfolio(user.id),
  });

  const { data: statsData } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: () => getMarketplaceStats(),
  });

  const portfolio = portfolioData?.portfolio || [];
  const summary = portfolioData?.summary || {};
  const marketStats = statsData?.overall || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold">InvoiceXRP</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Investor
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/marketplace" className="text-gray-600 hover:text-gray-900">
                Marketplace
              </Link>
              <button onClick={onLogout} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Welcome back, {user.company_name || 'Investor'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Invested</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total_invested || 0)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Profit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_profit || 0)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg ROI</p>
                <p className="text-2xl font-bold">{formatPercentage(summary.avg_roi || 0)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Investments</p>
                <p className="text-2xl font-bold">{summary.total_investments || 0}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Investments</h2>
            <Link to="/marketplace" className="btn btn-primary">
              Browse Marketplace
            </Link>
          </div>

          {portfolio.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No investments yet</p>
              <Link to="/marketplace" className="btn btn-primary">
                Start Investing
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                    <th className="text-left py-3 px-4 font-semibold">Seller</th>
                    <th className="text-right py-3 px-4 font-semibold">Invested</th>
                    <th className="text-right py-3 px-4 font-semibold">Expected Return</th>
                    <th className="text-right py-3 px-4 font-semibold">ROI</th>
                    <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((investment: any) => (
                    <tr key={investment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{investment.invoice_number}</td>
                      <td className="py-3 px-4">{investment.buyer_name}</td>
                      <td className="py-3 px-4 text-right">{formatCurrency(investment.invested_amount)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(investment.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">{formatPercentage(investment.roi_percentage)}</td>
                      <td className="py-3 px-4">{formatDate(investment.due_date)}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${investment.status === 'completed' ? 'badge-success' : 'badge-info'}`}>
                          {investment.status.toUpperCase()}
                        </span>
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