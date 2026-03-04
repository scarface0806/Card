import React from 'react';
import AdminLayoutClient from '@/components/AdminLayoutClient';

export const metadata = {
  title: 'Admin - Tapvyo',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
