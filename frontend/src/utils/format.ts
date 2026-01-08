import { format, formatDistanceToNow } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'RLUSD' ? 'USD' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string | Date): string => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatPercentage = (value: number | string | undefined | null) => {
  // 1. Nếu value là null/undefined -> coi là 0
  // 2. Ép kiểu về Number (vì PostgreSQL trả về string)
  const num = Number(value || 0);
  
  // 3. Kiểm tra nếu không phải số hợp lệ (NaN) -> trả về 0%
  if (isNaN(num)) return '0.0%';

  // 4. Format
  return `${num.toFixed(1)}%`; // Hoặc toFixed(2) tùy bạn muốn mấy số thập phân
};

export const formatAddress = (address: string, start: number = 6, end: number = 4): string => {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const calculateROI = (amount: number, sellingPrice: number): number => {
  return ((amount - sellingPrice) / sellingPrice) * 100;
};

export const calculateDaysUntilDue = (dueDate: string | Date): number => {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};