import { Clock, CheckCircle, AlertCircle, XCircle, List } from 'lucide-react';

interface Props {
  status: 'pending' | 'listed' | 'funded' | 'completed' | 'defaulted';
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const configs = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    listed: {
      icon: List,
      label: 'Listed',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    funded: {
      icon: CheckCircle,
      label: 'Funded',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    defaulted: {
      icon: XCircle,
      label: 'Defaulted',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </span>
  );
}