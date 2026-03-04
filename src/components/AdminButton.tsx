'use client';

import React from 'react';
import clsx from 'clsx';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export default function AdminButton({
  variant = 'primary',
  className,
  ...props
}: AdminButtonProps) {
  // consistent height, padding, font size, and smooth transition
  const base =
    'inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-semibold rounded-lg focus:outline-none transition-colors duration-150';

  const variants: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  };

  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
