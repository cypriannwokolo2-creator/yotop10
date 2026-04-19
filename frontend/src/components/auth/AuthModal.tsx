'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ShieldCheck, 
  Key, 
  RotateCcw, 
  ShieldAlert, 
  Copy, 
  CheckCircle2, 
  Info,
  Loader2,
  FileUp,
  Download,
  User,
  Zap,
  Camera,
  Keyboard
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { API, type TransferSession } from '@/lib/api';
import { storeRecoveredSession, ensureAuthenticated } from '@/lib/auth';
import { useAuth } from '@/context/PublicAuthContext';
import { cn } from '@/lib/utils';

type ScholarTab = 'backup' | 'link';
type GuestTab = 'status' | 'restore';

interface AuthModalProps {
  onClose: () => void;
  initialTab?: ScholarTab | GuestTab;
}

const BACKUP_STORAGE_KEY = 'yotop10_backup_key';

export default function AuthModal({ onClose, initialTab }: AuthModalProps) {
  const { status, generateRecoveryKey, refresh } = useAuth();

  // Scholar tabs
  const [scholarTab, setScholarTab] = useState<ScholarTab>(
    (initialTab === 'backup' || initialTab === 'link') ? initialTab : 'backup'
  );
  // Guest tabs
  const [guestTab, setGuestTab] = useState<GuestTab>(
    (initialTab === 'status' || initialTab === 'restore') ? initialTab : 'status'
  );
  
  // Recovery/Backup state
  const [recoveryKey, setRecoveryKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedToDevice, setSavedToDevice] = useState(false);

  // Check if backup already saved on device
  useEffect(() => {
    if (status === 'scholar') {
      const stored = localStorage.getItem(BACKUP_STORAGE_KEY);
      setSavedToDevice(!!stored);
      if (stored) setRecoveryKey(stored);
    }
  }, [status]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const key = await generateRecoveryKey();
      setRecoveryKey(key);
      // Refresh to update status to Scholar immediately
      await refresh();
    } catch (err) {
      console.error('[AuthModal] Failed to generate recovery key:', err);
      setError('Failed to generate recovery key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToDevice = () => {
    if (!recoveryKey) return;
    localStorage.setItem(BACKUP_STORAGE_KEY, recoveryKey);
    setSavedToDevice(true);
  };

  const handleDownloadFile = () => {
    if (!recoveryKey) return;
    const content = `YoTop10 Recovery Backup\n=========================\n\nKey: ${recoveryKey}\n\nIMPORTANT: Keep this file safe. Anyone with this key can access your account.\nGenerated: ${new Date().toISOString()}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yotop10-recovery-key.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative my-auto bg-card/95 backdrop-blur-xl border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-[2.5rem] w-full max-w-md overflow-hidden ring-1 ring-white/10 flex flex-col max-h-[calc(100dvh-4rem)]">
        
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tight uppercase">Identity Hub</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manage Scholar Status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-all active:scale-90"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 mb-4">
          {status === 'scholar' ? (
            <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border/50">
              <button
                onClick={() => setScholarTab('backup')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                  scholarTab === 'backup' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Backup
              </button>
              <button
                onClick={() => setScholarTab('link')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                  scholarTab === 'link' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Link Device
              </button>
            </div>
          ) : (
            <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl border border-border/50">
              <button
                onClick={() => setGuestTab('status')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                  guestTab === 'status' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                My Identity
              </button>
              <button
                onClick={() => setGuestTab('restore')}
                className={cn(
                  'flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                  guestTab === 'restore' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Restore
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 pt-2 custom-scrollbar">
          
          {/* === SCHOLAR VIEW === */}
          {status === 'scholar' && scholarTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] flex gap-4">
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700/80 leading-relaxed font-medium">
                  Your identity is secured. Keep a backup of your recovery key to ensure you never lose access.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 text-red-500 text-xs font-bold">
                  <ShieldAlert size={14} />
                  {error}
                </div>
              )}

              {recoveryKey ? (
                <div className="space-y-4">
                  {/* Key display */}
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={recoveryKey}
                      className="w-full h-12 pl-4 pr-12 rounded-xl bg-muted/50 font-mono text-xs border border-primary/20"
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted"
                    >
                      {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>

                  {/* Save actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleSaveToDevice}
                      disabled={savedToDevice}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all",
                        savedToDevice
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-muted text-foreground hover:bg-muted/80 border border-border"
                      )}
                    >
                      <ShieldCheck size={14} />
                      {savedToDevice ? 'Saved on Device' : 'Save to Device'}
                    </button>
                    <button
                      onClick={handleDownloadFile}
                      className="py-3 rounded-xl bg-muted text-foreground font-bold text-xs hover:bg-muted/80 border border-border flex items-center justify-center gap-2 transition-all"
                    >
                      <Download size={14} />
                      Download File
                    </button>
                  </div>

                  {savedToDevice && (
                    <p className="text-[10px] text-center text-emerald-600/70 font-bold uppercase tracking-tighter">
                      Backup stored on this device
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Key size={20} />}
                  Generate Recovery Key
                </button>
              )}
            </div>
          )}

          {status === 'scholar' && scholarTab === 'link' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <TransferIdentityModalContent />
            </div>
          )}

          {/* === GUEST VIEW === */}
          {status !== 'scholar' && guestTab === 'status' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Profile Overview */}
              <div className="p-6 rounded-[2rem] bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <User size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Current Identity</p>
                    <h3 className="text-xl font-bold">Guest</h3>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border w-fit">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Guest Identity</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-[1.5rem] flex gap-4">
                  <Zap size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700/80 leading-relaxed font-medium">
                    You are currently using a <strong>Guest Identity</strong>. To become a Scholar, gain more trust or backup your identity key.
                  </p>
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 text-red-500 text-xs font-bold">
                    <ShieldAlert size={14} />
                    {error}
                  </div>
                )}
                {recoveryKey ? (
                  <div className="space-y-4 pt-2">
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={recoveryKey}
                        className="w-full h-12 pl-4 pr-12 rounded-xl bg-muted/50 font-mono text-xs border border-primary/20"
                      />
                      <button
                        onClick={handleCopy}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-card border border-border shadow-sm hover:bg-muted"
                      >
                        {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
                      Save this key! It converts you to a Scholar.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                    Backup to become Scholar
                  </button>
                )}
              </div>
            </div>
          )}

          {status !== 'scholar' && guestTab === 'restore' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <RecoveryModalContent onClose={onClose} />
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="p-6 bg-muted/30 border-t border-border/50 flex items-start gap-3">
          <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            YoTop10 uses <strong>Lazy Identity</strong>. You don&apos;t need a password. Your identity is stored in this browser. Backup your key to ensure you never lose access.
          </p>
        </div>
      </div>
    </div>
  );
}

function TransferIdentityModalContent() {
  const [session, setSession] = useState<TransferSession | null>(null);
  const [status, setStatus] = useState<'loading' | 'waiting' | 'awaiting_approval' | 'confirmed' | 'expired' | 'error'>('loading');
  const [approving, setApproving] = useState(false);

  // Auto-initiate transfer on mount
  useEffect(() => {
    const initiate = async () => {
      try {
        await ensureAuthenticated();
        const data = await API.initiateTransfer();
        setSession(data);
        setStatus('waiting');
      } catch {
        setStatus('error');
      }
    };
    initiate();
  }, []);

  const handleApprove = async () => {
    if (!session) return;
    setApproving(true);
    try {
      await API.approveTransfer(session.session_id);
      setStatus('confirmed');
    } catch {
      // Approval failed
    } finally {
      setApproving(false);
    }
  };

  const pollStatus = useCallback(async () => {
    if (!session) return;
    try {
      const data = await API.getTransferStatus(session.session_id);
      if (data.status === 'awaiting_approval') setStatus('awaiting_approval');
      else if (data.status === 'confirmed') setStatus('confirmed');
      else if (data.status === 'expired') setStatus('expired');
    } catch {}
  }, [session]);

  useEffect(() => {
    if (status !== 'waiting' && status !== 'awaiting_approval') return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [status, pollStatus]);

  if (status === 'loading') return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-primary" size={32} /><p className="text-xs mt-3 font-bold text-muted-foreground">Generating QR code...</p></div>;

  if (status === 'error') return <div className="text-center py-10"><ShieldAlert className="mx-auto text-red-500" size={32} /><p className="text-xs mt-3 font-bold text-red-500">Failed to generate QR code</p></div>;

  if (status === 'awaiting_approval') {
    return (
      <div className="text-center space-y-4">
        <ShieldAlert className="mx-auto text-amber-500" size={32} />
        <h4 className="font-bold">Authorize Link?</h4>
        <p className="text-xs text-muted-foreground">Another device is requesting access to your identity.</p>
        <button onClick={handleApprove} disabled={approving} className="w-full py-3 rounded-xl bg-primary text-white font-bold">
           {approving ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Approve Access'}
        </button>
      </div>
    );
  }

  if (status === 'confirmed') return <div className="text-center py-10 text-emerald-500 font-bold"><CheckCircle2 className="mx-auto mb-2" size={32} /> Device Linked!</div>;

  if (status === 'expired') return <div className="text-center py-10"><ShieldAlert className="mx-auto text-amber-500" size={32} /><p className="text-xs mt-3 font-bold text-amber-500">QR code expired. Close and reopen to generate a new one.</p></div>;

  return (
    <div className="text-center space-y-4">
      <p className="text-xs text-muted-foreground">Scan this QR code with any phone camera to link your identity to another device.</p>
      <div className="inline-block p-4 bg-white rounded-2xl border border-border shadow-lg">
        {session && <QRCodeSVG value={session.qr_data} size={256} />}
      </div>
      <p className="text-[10px] font-bold text-primary animate-pulse uppercase">Awaiting Scan...</p>
      <p className="text-[9px] text-muted-foreground/60">Works with any camera app on Android, iPhone, or desktop</p>
    </div>
  );
}

/**
 * RecoveryModalContent — inline version of RecoveryModal for the AuthModal restore tab.
 * Includes QR camera scanning, key/file input, and backup key generation.
 */
function RecoveryModalContent({ onClose }: { onClose: () => void }) {
  const { claimAccount } = useAuth();
  const [claimKey, setClaimKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR Scanner state
  const [inputMode, setInputMode] = useState<'key' | 'scan'>('key');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'confirming' | 'waiting_approval' | 'success' | 'error' | 'no_camera'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [scanSessionId, setScanSessionId] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'auth-recovery-qr-scanner';

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

  // Stop scanner helper
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const s = scannerRef.current;
        scannerRef.current = null;
        if (s.isScanning) await s.stop();
      } catch {}
    }
  }, []);

  // Cleanup on unmount
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
    // Stop any existing scanner first
    await stopScanner();

    // Make sure the container element is in the DOM
    const container = document.getElementById(scannerContainerId);
    if (!container) {
      console.error('[QR Scanner] Container element not found, retrying in 500ms');
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
        // Not JSON — maybe a raw recovery key (UUID)
        const uuidMatch = decodedText.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
        if (uuidMatch) {
          stopScanner();
          setClaimKey(decodedText.trim());
          setInputMode('key');
        }
      }
    };

    // Adaptive qrbox size based on screen width
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

      // Try 1: Use getCameras() to pick back camera by ID (best for mobile)
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
          return; // Success
        }
      } catch (err) {
        console.warn('[QR Scanner] getCameras() failed, trying facingMode fallback:', err);
      }

      // Try 2: Fallback to facingMode string (works on some browsers where getCameras fails)
      try {
        await scanner.start(
          { facingMode: 'environment' as const },
          scannerConfig,
          onScanSuccess,
          () => {}
        );
        return; // Success
      } catch (err) {
        console.warn('[QR Scanner] facingMode fallback failed:', err);
      }

      // Both methods failed
      await stopScanner();
      setScanStatus('no_camera');
      setScanMessage('Could not start camera. Use key input instead.');
    } catch (err: any) {
      console.error('[QR Scanner] Failed to start:', err);
      await stopScanner();
      const msg = (err?.message || String(err)).toLowerCase();
      if (msg.includes('permission') || msg.includes('notallowed') || msg.includes('denied')) {
        setScanStatus('no_camera');
        setScanMessage('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (msg.includes('notfound') || msg.includes('device not found') || msg.includes('no camera')) {
        setScanStatus('no_camera');
        setScanMessage('No camera found on this device. Use key input instead.');
      } else if (msg.includes('secure context') || msg.includes('https')) {
        setScanStatus('no_camera');
        setScanMessage('Camera requires HTTPS. Use key input or access this site over HTTPS.');
      } else {
        setScanStatus('no_camera');
        setScanMessage('Could not start camera. Use key input instead.');
      }
    }
  }, [stopScanner, handleTransferConfirm]);

  // Start scanner when inputMode is 'scan'
  useEffect(() => {
    if (inputMode === 'scan' && (scanStatus === 'idle' || scanStatus === 'no_camera')) {
      // Small delay to ensure container is rendered
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    }
    if (inputMode !== 'scan') {
      stopScanner();
    }
  }, [inputMode, scanStatus, startScanner, stopScanner]);

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
    <div className="space-y-6">
      {/* Scan status overlays */}
      {scanStatus === 'success' && (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-green-600" />
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

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground hover:text-primary"
              >
                <FileUp size={20} />
                Select Recovery File
              </button>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 text-red-500 text-xs font-bold">
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
  );
}
