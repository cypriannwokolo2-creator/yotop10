'use client';

import { useState } from 'react';
import { X, Key, Copy, Check, ShieldAlert, RotateCcw, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/PublicAuthContext';

interface RecoveryModalProps {
  onClose: () => void;
}

export default function RecoveryModal({ onClose }: RecoveryModalProps) {
  const { generateRecoveryKey, claimAccount } = useAuth();
  const [mode, setMode] = useState<'backup' | 'claim'>('backup');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [claimKey, setClaimKey] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const key = await generateRecoveryKey();
      setRecoveryKey(key);
    } catch (err) {
      setError('Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimKey.trim()) return;
    setLoading(true);
    setError('');
    try {
      const success = await claimAccount(claimKey.trim());
      if (success) {
        onClose();
        // reload handled by context
      } else {
        setError('Invalid recovery key');
      }
    } catch {
      setError('Recovery failed. Check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Key size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Identity Recovery</h2>
              <p className="text-xs text-muted-foreground">Never lose your scholar status</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-6">
          <button
            onClick={() => setMode('backup')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === 'backup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Backup Account
          </button>
          <button
            onClick={() => setMode('claim')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              mode === 'claim' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Claim Existing
          </button>
        </div>

        {mode === 'backup' ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3">
              <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600 leading-relaxed">
                Your recovery key is the ONLY way to retrieve your account if you lose your device. 
                We do not store your identity on a central server, so we cannot "reset" this for you.
              </p>
            </div>

            {recoveryKey ? (
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    readOnly
                    value={recoveryKey}
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-muted font-mono text-sm border-2 border-primary/20"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-center text-muted-foreground">
                  Store this key somewhere safe (e.g., a password manager).
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                Generate My Recovery Key
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            <p className="text-sm text-center text-muted-foreground px-4">
              Enter your recovery key below to move your scholar identity to this device.
            </p>
            
            <div>
              <input
                type="text"
                value={claimKey}
                onChange={(e) => setClaimKey(e.target.value)}
                placeholder="Paste your secret key here..."
                className="w-full h-12 px-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {error && <p className="text-xs text-red-500 mt-2 ml-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !claimKey.trim()}
              className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
              Restore Account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Utility
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
