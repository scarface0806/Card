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
    <div className="frontend-dark min-h-screen bg-[#020617] text-slate-50">
      <AuthProvider>
        <ProductProvider>
          {children}
        </ProductProvider>
      </AuthProvider>
    </div>
  );
}
