'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { PublicAuthProvider } from '@/context/PublicAuthContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <PublicAuthProvider>
      <AdminAuthProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
          {!isAdminRoute && <Header />}
          <main className="flex-1 flex flex-col">{children}</main>
          {!isAdminRoute && <Footer />}
        </div>
      </AdminAuthProvider>
    </PublicAuthProvider>
  );
}
