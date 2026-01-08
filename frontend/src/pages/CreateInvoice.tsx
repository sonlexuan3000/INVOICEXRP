import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Loader } from 'lucide-react';
import { createInvoice } from '../services/api';
import type { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
}

export default function CreateInvoice({ user }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    buyerName: '',
    amount: '',
    dueDate: '',
    discountRate: '5',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Invoice number is required';
    }
    
    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Buyer name is required';
    }
    
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      if (dueDate <= today) {
        newErrors.dueDate = 'Due date must be in the future';
      }
    }
    
    const discount = parseFloat(formData.discountRate);
    if (discount < 0 || discount > 20) {
      newErrors.discountRate = 'Discount must be between 0% and 20%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const userSeed = localStorage.getItem(`wallet_seed_${user.id}`);
      
      if (!userSeed) {
        alert('Wallet seed not found. Please reconnect your wallet.');
        return;
      }

      await createInvoice({
        invoiceNumber: formData.invoiceNumber,
        sellerId: user.id,
        buyerName: formData.buyerName,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        discountRate: parseFloat(formData.discountRate),
        issuerSeed: userSeed,
      });

      alert('Invoice created successfully!');
      navigate('/seller');
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      alert(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sellingPrice = formData.amount
    ? parseFloat(formData.amount) * (1 - parseFloat(formData.discountRate) / 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/seller" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6">Create New Invoice</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  placeholder="INV-2025-001"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Name *
                </label>
                <input
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Amount (RLUSD) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="100000"
                  min="0"
                  step="0.01"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Rate (%) *
              </label>
              <input
                type="number"
                name="discountRate"
                value={formData.discountRate}
                onChange={handleChange}
                placeholder="5"
                min="0"
                max="20"
                step="0.1"
                className="input"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Typical range: 3-8%. Higher discount = faster funding.
              </p>
            </div>

            {formData.amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Funding Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Invoice Amount:</span>
                    <span className="font-semibold">${parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Discount ({formData.discountRate}%):</span>
                    <span className="font-semibold text-red-600">
                      -${(parseFloat(formData.amount) - sellingPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-blue-900 font-semibold">You Receive:</span>
                    <span className="font-bold text-green-600 text-lg">
                      ${sellingPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Create Invoice</span>
                  </>
                )}
              </button>
              <Link to="/seller" className="btn btn-secondary flex-1">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}