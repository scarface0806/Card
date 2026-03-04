import React from 'react';

interface AdminTableProps {
  header: React.ReactNode;
  children: React.ReactNode; // rows
  className?: string;
}

export default function AdminTable({ header, children, className = '' }: AdminTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 text-left text-sm font-medium text-gray-900">
          {header}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {children}
        </tbody>
      </table>
    </div>
  );
}
