import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red';
}

const colorConfig = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-600' },
  red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
};

export default function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  color = 'blue' 
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-6 flex items-between justify-between`}>
      <div className="flex-1">
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {trend && (
          <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
          </p>
        )}
      </div>
      {icon && (
        <div className={`${config.icon} text-4xl opacity-20`}>
          {icon}
        </div>
      )}
    </div>
  );
}
