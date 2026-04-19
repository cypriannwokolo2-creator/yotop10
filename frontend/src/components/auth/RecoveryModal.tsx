'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Key, 
  Copy, 
  Check, 
  ShieldAlert, 
  RotateCcw, 
  Loader2, 
  FileUp, 
  ShieldCheck,
  Download,
  CheckCircle2,
  Camera,
  Keyboard
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { API } from '@/lib/api';
import { storeRecoveredSession } from '@/lib/auth';
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

  // QR Scanner state
  const [inputMode, setInputMode] = useState<'key' | 'scan'>('key');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'confirming' | 'waiting_approval' | 'success' | 'error' | 'no_camera'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [scanSessionId, setScanSessionId] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'recovery-qr-scanner';

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const key = await generateRecoveryKey();
      setRecoveryKey(key);
    } catch {
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

  // --- QR Scanner logic ---

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current;
        scannerRef.current = null;
        if (s.isScanning) await s.stop();
      } catch {}
    }
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const handleTransferConfirm = useCallback(async (sid: string) => {
    await stopScanner();
    setScanSessionId(sid);
    setScanStatus('confirming');
    setScanMessage('');
    try {
      const res = await API.confirmTransfer(sid);
      if (res.success) {
        storeRecoveredSession({ token: res.token, expires_at: res.expires_at, username: res.username });
        setScanStatus('success');
        setScanMessage('Identity recovered! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setScanStatus('waiting_approval');
      }
    } catch {
      setScanStatus('error');
      setScanMessage('Transfer failed. The code may be invalid or expired.');
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    await stopScanner();

    const container = document.getElementById(scannerContainerId);
    if (!container) {
      await new Promise(r => setTimeout(r, 500));
      const retry = document.getElementById(scannerContainerId);
      if (!retry) {
        setScanStatus('no_camera');
        setScanMessage('Scanner element not found. Use key input instead.');
        return;
      }
    }

    const onScanSuccess = (decodedText: string) => {
      try {
        const data = JSON.parse(decodedText);
        if (data.type === 'yotop10_transfer' && data.session_id) {
          handleTransferConfirm(data.session_id);
        } else if (data.recovery_key) {
          stopScanner();
          setClaimKey(data.recovery_key);
          setInputMode('key');
        }
      } catch {
        const uuidMatch = decodedText.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
        if (uuidMatch) {
          stopScanner();
          setClaimKey(decodedText.trim());
          setInputMode('key');
        }
      }
    };

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 300;
    const qrboxSize = Math.min(250, screenWidth - 80);

    const scannerConfig = {
      fps: 15,
      qrbox: { width: qrboxSize, height: qrboxSize },
      aspectRatio: 1.0,
    };

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;
      setScanStatus('scanning');

      // Try 1: Use getCameras() to pick back camera by ID
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const backCamera = devices.find(d =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          const cameraId = backCamera?.id || devices[0].id;
          await scanner.start(cameraId, scannerConfig, onScanSuccess, () => {});
          return;
        }
      } catch (err) {
        console.warn('[QR Scanner] getCameras() failed, trying facingMode fallback:', err);
      }

      // Try 2: Fallback to facingMode string
      try {
        await scanner.start(
          { facingMode: 'environment' as const },
          scannerConfig,
          onScanSuccess,
          () => {}
        );
        return;
      } catch (err) {
        console.warn('[QR Scanner] facingMode fallback failed:', err);
      }

      await stopScanner();
      setScanStatus('no_camera');
      setScanMessage('Could not start camera. Use key input instead.');
    } catch (err: any) {
      console.error('[QR Scanner] Failed to start:', err);
      await stopScanner();
      const msg = (err?.message || String(err)).toLowerCase();
      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setScanStatus('no_camera');
        setScanMessage('Camera permission denied. Allow camera access and try again.');
      } else if (msg.includes('notfound') || msg.includes('device not found') || msg.includes('no camera')) {
        setScanStatus('no_camera');
        setScanMessage('No camera found on this device. Use key input instead.');
      } else if (msg.includes('secure context') || msg.includes('https')) {
        setScanStatus('no_camera');
        setScanMessage('Camera requires HTTPS. Use key input or access via HTTPS.');
      } else {
        setScanStatus('no_camera');
        setScanMessage('Could not start camera. Use key input instead.');
      }
    }
  }, [stopScanner, handleTransferConfirm]);

  useEffect(() => {
    if (inputMode === 'scan' && (scanStatus === 'idle' || scanStatus === 'no_camera')) {
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    }
    if (inputMode !== 'scan') {
      stopScanner();
    }
  }, [inputMode, scanStatus, startScanner, stopScanner]);

  // Poll for approval from source device
  const pollForApproval = useCallback(async () => {
    if (!scanSessionId) return;
    try {
      const res = await API.confirmTransfer(scanSessionId);
      if (res.success) {
        storeRecoveredSession({ token: res.token, expires_at: res.expires_at, username: res.username });
        setScanStatus('success');
        setScanMessage('Identity recovered! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch {
      setScanStatus('error');
      setScanMessage('Transfer expired or was denied. Try again.');
    }
  }, [scanSessionId]);

  useEffect(() => {
    if (scanStatus !== 'waiting_approval') return;
    const interval = setInterval(pollForApproval, 3000);
    return () => clearInterval(interval);
  }, [scanStatus, pollForApproval]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative my-auto bg-card/95 backdrop-blur-xl border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-[2.5rem] w-full max-w-md p-8 overflow-y-auto max-h-[calc(100dvh-2rem)] ring-1 ring-white/10 custom-scrollbar">
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
          <div className="space-y-6">
            {/* Scan status overlays */}
            {scanStatus === 'success' && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-green-600" />
                </div>
                <p className="font-semibold text-lg mb-1">Identity Recovered!</p>
                <p className="text-sm text-muted-foreground">{scanMessage}</p>
              </div>
            )}

            {scanStatus === 'confirming' && (
              <div className="text-center py-6">
                <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
                <p className="font-semibold mb-1">Connecting...</p>
                <p className="text-sm text-muted-foreground">Contacting the source device...</p>
              </div>
            )}

            {scanStatus === 'waiting_approval' && (
              <div className="text-center py-6">
                <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
                <p className="font-semibold mb-1">Waiting for approval</p>
                <p className="text-sm text-muted-foreground">The source device needs to approve this transfer.</p>
              </div>
            )}

            {scanStatus === 'error' && (
              <div className="text-center py-6">
                <p className="text-sm text-red-500 mb-4">{scanMessage}</p>
                <button
                  onClick={() => { setScanStatus('idle'); setScanSessionId(''); }}
                  className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {(scanStatus === 'idle' || scanStatus === 'scanning' || scanStatus === 'no_camera') && (
              <>
                {/* Input mode toggle */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border/50">
                  <button
                    onClick={() => {
                      stopScanner();
                      setInputMode('key');
                    }}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                      inputMode === 'key' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Keyboard size={14} />
                    Key / File
                  </button>
                  <button
                    onClick={() => setInputMode('scan')}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                      inputMode === 'scan' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Camera size={14} />
                    Scan QR
                  </button>
                </div>

                {inputMode === 'scan' ? (
                  <div className="space-y-4">
                    {scanStatus === 'scanning' && (
                      <p className="text-sm text-muted-foreground text-center leading-relaxed">
                        Point your camera at the QR code displayed on your other device.
                      </p>
                    )}
                    {scanStatus === 'no_camera' && (
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center space-y-3">
                        <ShieldAlert size={24} className="mx-auto text-amber-500" />
                        <p className="text-sm font-bold text-amber-600">{scanMessage || 'Camera not available'}</p>
                        <button
                          onClick={startScanner}
                          className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
                        >
                          Retry Camera
                        </button>
                      </div>
                    )}
                    {(scanStatus === 'idle' || scanStatus === 'scanning') && (
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-black" style={{ minHeight: 280 }}>
                        {scanStatus === 'idle' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin text-primary" />
                          </div>
                        )}
                        <div id={scannerContainerId} className="w-full" />
                      </div>
                    )}
                    <p className="text-[10px] text-center text-muted-foreground/60 font-medium">
                      Supports transfer QR codes and recovery key QR codes
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleClaim} className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground px-4 leading-relaxed font-medium">
                      Paste your secret key or upload your backup file to restore your identity.
                    </p>

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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
