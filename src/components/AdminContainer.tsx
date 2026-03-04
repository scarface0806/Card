import React from 'react';

interface AdminContainerProps {
  children: React.ReactNode;
}

// A simple centered container with max width and standard padding
export default function AdminContainer({ children }: AdminContainerProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
  );
}
