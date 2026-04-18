'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API } from '@/lib/api';

interface AdminUser {
  id: string;
  username: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  login: (adminData: AdminUser) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isPublicAdminRoute = pathname === '/admin/login' || pathname.startsWith('/admin/setup');

  const refresh = useCallback(async () => {
    try {
      const data = await API.adminGetMe();
      setAdmin(data as AdminUser);
    } catch (err) {
      setAdmin(null);
      // Only redirect to login if we are actually on a protected admin page
      if (isAdminRoute && !isPublicAdminRoute) {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [isAdminRoute, isPublicAdminRoute, router]);

  useEffect(() => {
    if (isAdminRoute) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [isAdminRoute, refresh]);

  const login = (adminData: AdminUser) => {
    setAdmin(adminData);
    router.push('/admin');
  };

  const logout = async () => {
    try {
      await API.adminLogout();
      setAdmin(null);
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout, refresh }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminAuthProvider');
  }
  return context;
}
