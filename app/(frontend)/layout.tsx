'use client';

import React from 'react';
import AuthProvider from '@/components/AuthProvider';
import { ProductProvider } from '@/contexts/ProductContext';

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <AuthProvider>
        <ProductProvider>
          {children}
        </ProductProvider>
      </AuthProvider>
    </div>
  );
}
