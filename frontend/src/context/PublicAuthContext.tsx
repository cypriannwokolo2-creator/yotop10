'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { API } from '@/lib/api';
import { ensureAuthenticated, signOutThisDevice } from '@/lib/auth';

interface PublicAuthContextType {
  user: any | null;
  loading: boolean;
  status: 'guest' | 'scholar' | 'unauthenticated';
  activity: UserActivity;
  sessionRevoked: boolean;
  clearRevoked: () => void;
  refresh: () => Promise<void>;
  logout: () => void;
  generateRecoveryKey: () => Promise<string>;
  claimAccount: (key: string) => Promise<boolean>;
  updateActivity: (type: keyof UserActivity, id: string, action: 'add' | 'remove') => void;
}

interface UserActivity {
  likedPosts: string[];
  bookmarkedPosts: string[];
  commentedPosts: string[];
}

const PublicAuthContext = createContext<PublicAuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<UserActivity>({
    likedPosts: [],
    bookmarkedPosts: [],
    commentedPosts: [],
  });
  const [sessionRevoked, setSessionRevoked] = useState(false);

  // Listen for session-revoked event from apiFetch 401 handler
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSessionRevoked(true);
    };
    window.addEventListener('session-revoked', handler);
    return () => window.removeEventListener('session-revoked', handler);
  }, []);

  const clearRevoked = () => setSessionRevoked(false);

  const refresh = useCallback(async () => {
    try {
      // 1. Ensure we at least have a guest session
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        setLoading(false);
        return;
      }

      // 2. Load full user profile
      const userData = await API.getCurrentUser();
      setUser(userData);

      // 3. TODO: Load activity from a specific endpoint if available
      // For now we'll assume it's part of the user data or empty
    } catch (err) {
      console.error('[PublicAuth] Failed to load identity:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = async () => {
    await signOutThisDevice();
    setUser(null);
    window.location.reload();
  };

  const updateActivity = (type: keyof UserActivity, id: string, action: 'add' | 'remove') => {
    setActivity(prev => {
      const current = prev[type];
      const updated = action === 'add' 
        ? [...new Set([...current, id])] 
        : current.filter(item => item !== id);
      return { ...prev, [type]: updated };
    });
  };

  const generateRecoveryKey = async () => {
    await ensureAuthenticated();
    const res = await API.generateRecoveryKey();
    return res.recovery_key;
  };

  const claimAccount = async (key: string) => {
    const res = await API.claimAccount(key);
    if (res.success) {
      const { storeRecoveredSession } = await import('@/lib/auth');
      storeRecoveredSession({
        token: res.token,
        expires_at: res.expires_at,
        username: res.username
      });
      await refresh();
      return true;
    }
    return false;
  };

  const status = user 
    ? (user.trust_level === 'scholar' ? 'scholar' : 'guest') 
    : 'unauthenticated';

  return (
    <PublicAuthContext.Provider value={{ 
      user, 
      loading, 
      status, 
      activity, 
      sessionRevoked,
      clearRevoked,
      refresh, 
      logout,
      generateRecoveryKey,
      claimAccount,
      updateActivity
    }}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(PublicAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a PublicAuthProvider');
  }
  return context;
}
