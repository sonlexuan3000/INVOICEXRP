import { useState } from 'react';
import { Wallet, TrendingUp, Shield, Zap, ArrowRight } from 'lucide-react';
import { connectWallet, generateWallet } from '../services/api';
import type { User } from '../types';

interface Props {
  onLogin: (user: User) => void;
}

export default function LandingPage({ onLogin }: Props) {
  const [showConnect, setShowConnect] = useState(false);
  const [userType, setUserType] = useState<'seller' | 'investor'>('seller');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletSeed, setWalletSeed] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateWallet = async () => {
    try {
      const result = await generateWallet();
      setWalletAddress(result.wallet.address);
      setWalletSeed(result.wallet.seed);
      alert(`Generated Wallet!\nAddress: ${result.wallet.address}\nSeed: ${result.wallet.seed}\n\n⚠️ Save your seed securely!`);
    } catch (error) {
      console.error('Error generating wallet:', error);
      alert('Failed to generate wallet');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await connectWallet({
        walletAddress,
        userType,
        email,
        companyName,
      });

      // Save seed to localStorage
      if (walletSeed) {
        localStorage.setItem(`wallet_seed_${result.user.id}`, walletSeed);
      }

      onLogin(result.user);
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  if (showConnect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect Wallet</h2>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('seller')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userType === 'seller'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Seller</div>
                  <div className="text-sm text-gray-600">I need funding</div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('investor')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    userType === 'investor'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">Investor</div>
                  <div className="text-sm text-gray-600">I want to invest</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="rXXXXXXXXXXXXXXXXXXXXX"
                className="input"
                required
              />
              <button
                type="button"
                onClick={handleGenerateWallet}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                Generate new wallet
              </button>
            </div>

            {walletSeed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-yellow-800 mb-1">⚠️ Wallet Seed</p>
                <p className="text-xs text-yellow-700 mb-2">Save this securely! You'll need it to create invoices.</p>
                <code className="block text-xs bg-white p-2 rounded border border-yellow-300 break-all">
                  {walletSeed}
                </code>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Ltd."
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !walletAddress}
              className="btn btn-primary w-full"
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>

            <button
              type="button"
              onClick={() => setShowConnect(false)}
              className="btn btn-secondary w-full"
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Wallet className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">InvoiceXRP</span>
            </div>
            <button onClick={() => setShowConnect(true)} className="btn btn-primary">
              Connect Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Turn Your Invoices Into
            <span className="block text-blue-600">Cash in 24 Hours</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Invoice financing platform powered by XRPL. Get paid instantly, no collateral needed.
          </p>
          <button onClick={() => setShowConnect(true)} className="btn btn-primary text-lg px-8 py-4">
            Get Started <ArrowRight className="w-5 h-5 inline ml-2" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">$2M+</div>
            <div className="text-gray-600">Invoice Value Financed</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
            <div className="text-gray-600">On-time Payment Rate</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">&lt;1 Day</div>
            <div className="text-gray-600">Average Funding Time</div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <Zap className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Instant Funding</h3>
            <p className="text-gray-600">
              Get cash within hours, not weeks. No lengthy approval process.
            </p>
          </div>
          <div className="card">
            <Shield className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Secure & Transparent</h3>
            <p className="text-gray-600">
              Built on XRPL with smart escrows. Every transaction is traceable.
            </p>
          </div>
          <div className="card">
            <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">High Returns</h3>
            <p className="text-gray-600">
              Investors earn 3-8% returns in 30-90 days with minimal risk.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Upload Invoice</h3>
              <p className="text-gray-600">
                Sellers upload their invoices with buyer details and due date
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Get Funded</h3>
              <p className="text-gray-600">
                Investors buy invoices at discount. Sellers receive cash instantly
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Auto Settlement</h3>
              <p className="text-gray-600">
                When buyer pays, escrow releases funds to investor automatically
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>Built on XRPL • Powered by Smart Contracts</p>
            <p className="mt-2 text-sm">© 2025 InvoiceXRP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}