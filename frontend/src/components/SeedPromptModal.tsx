import { useState } from 'react';
import { AlertTriangle, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSubmit: (seed: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export default function SeedPromptModal({
  isOpen,
  onSubmit,
  onCancel,
  title = 'Wallet Seed Required',
  description = 'Enter your wallet seed to sign this transaction',
}: Props) {
  const [seed, setSeed] = useState('');
  const [showSeed, setShowSeed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seed.trim()) {
      onSubmit(seed.trim());
      setSeed('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>

      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start space-x-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Seed
            </label>
            <div className="relative">
              <input
                type={showSeed ? 'text' : 'password'}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="sEdXXXXXXXXXXXXXXXXXXXXX"
                className="input pr-20"
                required
              />
              <button
                type="button"
                onClick={() => setShowSeed(!showSeed)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700"
              >
                {showSeed ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your seed is stored locally and never sent to our servers
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                Never share your seed with anyone. We will never ask for your seed outside of signing transactions.
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button type="submit" className="btn btn-primary flex-1">
              Continue
            </button>
            <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}