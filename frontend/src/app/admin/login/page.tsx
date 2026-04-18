'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/lib/api';
import Logo from '@/components/ui/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await API.adminLogin(username, password);
      router.push('/admin');
    } catch (err: any) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-border shadow-xl">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">Secure your identity</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium text-center border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
