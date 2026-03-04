import React from 'react';

interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export default function AdminCard({ children, className = '', title, actions }: AdminCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-medium text-gray-900">{title}</h2>}
          {actions && <div className="space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
