import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  label?: string;
}

const statusConfig = {
  active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  completed: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
      <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`}></span>
      {displayLabel}
    </div>
  );
}
