import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Props {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
  showFilters?: boolean;
}

export default function SearchFilter({ onSearch, onFilterChange, showFilters = true }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    creditScore: '',
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({ minAmount: '', maxAmount: '', creditScore: '' });
    onFilterChange({ minAmount: '', maxAmount: '', creditScore: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search invoices..."
            className="input pl-10"
          />
        </div>
        {showFilters && (
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span>Filters</span>
          </button>
        )}
      </div>

      {isFilterOpen && (
        <div className="card bg-slate-50 border-slate-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filter Options</h3>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700">
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                placeholder="1000000"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Credit Score</label>
              <input
                type="number"
                value={filters.creditScore}
                onChange={(e) => handleFilterChange('creditScore', e.target.value)}
                placeholder="70"
                min="0"
                max="100"
                className="input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}