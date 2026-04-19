'use client';

import { useState, useRef } from 'react';
import { 
  X, 
  Key, 
  Copy, 
  Check, 
  ShieldAlert, 
  RotateCcw, 
  Loader2, 
  FileUp, 
  Info,
  ShieldCheck,
  Download,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/PublicAuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const match = content.match(/Key:\s*([a-f0-9-]{36})/i);
      if (match && match[1]) {
        setClaimKey(match[1]);
        setError('');
      } else {
        setError('Could not find a valid key in that file.');
      }
    };
    reader.readAsText(file);
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
        window.location.reload();
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-card/95 backdrop-blur-xl border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-[2.5rem] w-full max-w-md p-8 overflow-y-auto max-h-[calc(100dvh-2rem)] ring-1 ring-white/10 custom-scrollbar self-center">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-all active:scale-90 z-10"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <ShieldCheck size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight">Identity Recovery</h2>
            <p className="text-xs font-medium text-muted-foreground">Secure your scholar status</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl mb-8 border border-border/50">
          <button
            onClick={() => setMode('backup')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              mode === 'backup' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Backup
          </button>
          <button
            onClick={() => setMode('claim')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              mode === 'claim' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Restore
          </button>
        </div>

        {mode === 'backup' ? (
          <div className="space-y-6">
            <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-4">
              <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                Your recovery key is the <span className="font-bold underline">only</span> way to retrieve your account if you lose your device. Keep it secret.
              </p>
            </div>

            {recoveryKey ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/0 rounded-2xl blur opacity-25"></div>
                  <input
                    type="text"
                    readOnly
                    value={recoveryKey}
                    className="relative w-full h-14 pl-5 pr-14 rounded-2xl bg-muted/50 font-mono text-sm border-2 border-primary/20 focus:border-primary/40 outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-card border border-border shadow-sm hover:bg-muted transition-all active:scale-90"
                  >
                    {copied ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                  </button>
                </div>
                
                <p className="text-[11px] text-center text-muted-foreground font-medium px-4">
                  Store this key in a password manager or as a hidden file.
                </p>

                <div className="pt-4 border-t border-border/50 text-center">
                  <Link 
                    href="/settings" 
                    className="inline-flex items-center gap-2 text-xs text-primary font-black uppercase tracking-widest hover:underline"
                    onClick={onClose}
                  >
                    <Download size={14} />
                    Download Recovery File
                  </Link>
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Key size={20} />}
                Generate Recovery Key
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-6">
            <p className="text-sm text-center text-muted-foreground px-4 leading-relaxed font-medium">
              Paste your secret key or upload your backup file to restore your identity.
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={claimKey}
                onChange={(e) => setClaimKey(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full h-14 px-5 rounded-2xl border border-border bg-background/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="bg-card px-3 text-muted-foreground/50">Or Upload</span>
                </div>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".txt" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground hover:text-primary"
              >
                <FileUp size={20} />
                Select Recovery File
              </button>
              
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 text-red-500 text-xs font-bold animate-in fade-in">
                  <ShieldAlert size={14} />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !claimKey.trim()}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20} />}
              Restore Identity
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
