'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, QrCode, Loader2, Check, Smartphone, ShieldCheck, Camera, Keyboard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { API, type TransferSession } from '@/lib/api';
import { storeRecoveredSession } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface TransferIdentityModalProps {
  onClose: () => void;
}

type Tab = 'send' | 'receive';

export default function TransferIdentityModal({ onClose }: TransferIdentityModalProps) {
  const [tab, setTab] = useState<Tab>('send');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-card/95 backdrop-blur-xl border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-[2rem] w-full max-w-md p-8 overflow-hidden ring-1 ring-white/10">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-all active:scale-90"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <QrCode size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight">Identity Link</h2>
            <p className="text-xs font-medium text-muted-foreground">Sync your scholar status</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl mb-8 border border-border/50">
          <button
            onClick={() => setTab('send')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'send' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Send Link
          </button>
          <button
            onClick={() => setTab('receive')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
              tab === 'receive' ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Receive Link
          </button>
        </div>

        <div className="min-h-[300px] flex flex-col">
          {tab === 'send' ? <SendTab /> : <ReceiveTab />}
        </div>
      </div>
    </div>
  );
}

/** Send tab: Generate QR code on this device, other device scans it */
function SendTab() {
  const [session, setSession] = useState<TransferSession | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'waiting' | 'awaiting_approval' | 'confirmed' | 'expired' | 'error'>('idle');
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);

  const initiate = async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await API.initiateTransfer();
      setSession(data);
      setStatus('waiting');
    } catch {
      setStatus('error');
      setError('Failed to start transfer. Try again.');
    }
  };

  // Approve transfer from THIS (source) device
  const handleApprove = async () => {
    if (!session) return;
    setApproving(true);
    try {
      await API.approveTransfer(session.session_id);
      setStatus('confirmed');
    } catch {
      setError('Failed to approve. Try again.');
    } finally {
      setApproving(false);
    }
  };

  // Poll for status changes
  const pollStatus = useCallback(async () => {
    if (!session) return;
    try {
      const data = await API.getTransferStatus(session.session_id);
      if (data.status === 'awaiting_approval') {
        setStatus('awaiting_approval');
      } else if (data.status === 'confirmed') {
        setStatus('confirmed');
      } else if (data.status === 'expired') {
        setStatus('expired');
      }
    } catch {
      // Silently retry
    }
  }, [session]);

  useEffect(() => {
    if (status !== 'waiting' && status !== 'awaiting_approval') return;
    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [status, pollStatus]);

  if (status === 'idle') {
    return (
      <div className="text-center py-6 flex-1 flex flex-col justify-center">
        <div className="w-20 h-20 rounded-[2rem] bg-muted/50 flex items-center justify-center mx-auto mb-6">
          <Smartphone size={40} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground mb-8 px-4 leading-relaxed">
          Generate a secure link on this device. Scan it on your other device to securely transfer your identity.
        </p>
        <button
          onClick={initiate}
          className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
        >
          Generate Link
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="text-center py-12 flex-1 flex flex-col justify-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm font-bold text-muted-foreground">Securing session...</p>
      </div>
    );
  }

  if (status === 'awaiting_approval') {
    return (
      <div className="text-center py-6 flex-1 flex flex-col justify-center">
        <div className="w-20 h-20 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} className="text-amber-500" />
        </div>
        <h3 className="font-black text-xl mb-2">Authorize Link?</h3>
        <p className="text-sm text-muted-foreground mb-8 px-2 leading-relaxed">
          A new device is requesting access to your scholar identity. Approve only if you recognize the action.
        </p>
        {error && <p className="text-xs font-bold text-red-500 mb-4">{error}</p>}
        <div className="flex gap-3">
          <button
            onClick={initiate}
            className="flex-1 py-4 rounded-2xl bg-muted text-sm font-bold hover:bg-muted/80 transition-all active:scale-[0.98]"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex-[2] py-4 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {approving ? <Loader2 size={16} className="animate-spin" /> : null}
            Approve Access
          </button>
        </div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="text-center py-12 flex-1 flex flex-col justify-center">
        <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-green-500" />
        </div>
        <h3 className="font-black text-xl mb-2">Success!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">Your identity has been securely linked to the new device.</p>
      </div>
    );
  }

  // Waiting — show QR code + session ID for manual fallback
  const sessionId = session?.session_id || '';

  return (
    <div className="text-center py-2 flex-1 flex flex-col">
      <div className="inline-block p-6 bg-white rounded-[2.5rem] shadow-xl shadow-black/5 border border-border/50 mx-auto mb-6">
        {session && (
          <QRCodeSVG
            value={session.qr_data}
            size={220}
            level="H"
            bgColor="#ffffff"
            fgColor="#171717"
            includeMargin={false}
          />
        )}
      </div>
      
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
        <p className="text-sm font-bold tracking-tight">Awaiting Scan...</p>
      </div>

      <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
        Link expires in <span className="text-foreground font-bold">5 minutes</span>.
        <br />
        Enter code manually if camera is unavailable.
      </p>

      {/* Manual fallback: show session ID */}
      <div className="mt-auto pt-6 border-t border-border/50">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Manual Link Code</p>
        <button
          onClick={() => { navigator.clipboard.writeText(sessionId); }}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-muted/50 border border-border/50 text-xs font-mono tracking-wider hover:bg-muted transition-all group"
          title="Click to copy"
        >
          <span className="text-foreground font-bold">{sessionId.slice(0, 8)}...{sessionId.slice(-8)}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Receive tab: Scan QR code with camera OR enter code manually.
 * Flow: scan/enter → confirm (sets awaiting_approval) → poll until confirmed → get token
 */
function ReceiveTab() {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'confirming' | 'waiting_approval' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-region';

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Start camera scanner
  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Parse QR data
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'yotop10_transfer' && data.session_id) {
              scanner.stop().catch(() => {});
              handleConfirm(data.session_id);
            }
          } catch {
            // Not our QR code format — ignore
          }
        },
        () => {} // ignore scan failures (no QR in frame)
      );
    } catch (err) {
      console.error('[QR Scanner] Failed to start:', err);
      setMode('manual'); // Fall back to manual if camera fails
    }

  }, []);

  // Start scanner when mode is 'scan'
  useEffect(() => {
    if (mode === 'scan' && status === 'idle') {
      // Small delay to ensure DOM element exists
      const timer = setTimeout(startScanner, 100);
      return () => clearTimeout(timer);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [mode, status, startScanner]);

  // Confirm transfer — first call sets awaiting_approval, then poll
  const handleConfirm = async (sid: string) => {
    setSessionId(sid);
    setStatus('confirming');
    setMessage('');

    try {
      const res = await API.confirmTransfer(sid);
      if (res.success) {
        // Source already approved — done immediately
        storeRecoveredSession({ token: res.token, expires_at: res.expires_at, username: res.username });
        setStatus('success');
        setMessage('Identity transferred! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        // Waiting for source approval — start polling
        setStatus('waiting_approval');
      }
    } catch {
      setStatus('error');
      setMessage('Transfer failed. The code may be invalid or expired.');
    }
  };

  // Poll for approval from source device
  const pollForApproval = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await API.confirmTransfer(sessionId);
      if (res.success) {
        storeRecoveredSession({ token: res.token, expires_at: res.expires_at, username: res.username });
        setStatus('success');
        setMessage('Identity transferred! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      }
      // If not success, keep polling (still awaiting_approval)
    } catch {
      // Transfer expired or failed
      setStatus('error');
      setMessage('Transfer expired or was denied. Try again.');
    }
  }, [sessionId]);

  useEffect(() => {
    if (status !== 'waiting_approval') return;
    const interval = setInterval(pollForApproval, 3000);
    return () => clearInterval(interval);
  }, [status, pollForApproval]);

  // Manual submit handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    handleConfirm(code.trim());
  };

  // --- Success state ---
  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <p className="font-semibold text-lg mb-1">Identity Received!</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  }

  // --- Confirming / Waiting for approval ---
  if (status === 'confirming' || status === 'waiting_approval') {
    return (
      <div className="text-center py-6">
        <Loader2 size={28} className="mx-auto mb-3 animate-spin text-primary" />
        <p className="font-semibold mb-1">
          {status === 'confirming' ? 'Connecting...' : 'Waiting for approval'}
        </p>
        <p className="text-sm text-muted-foreground">
          {status === 'waiting_approval'
            ? 'The source device needs to approve this transfer.'
            : 'Contacting the source device...'}
        </p>
      </div>
    );
  }

  // --- Error state ---
  if (status === 'error') {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500 mb-4">{message}</p>
        <button
          onClick={() => { setStatus('idle'); setCode(''); setSessionId(''); }}
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- Idle: Scan or Manual ---
  return (
    <div className="py-2">
      {mode === 'scan' ? (
        <>
          <p className="text-sm text-muted-foreground mb-3 text-center">
            Point your camera at the QR code on the other device.
          </p>

          {/* Camera viewfinder */}
          <div className="relative rounded-xl overflow-hidden border border-border mb-3 bg-black" style={{ minHeight: 260 }}>
            <div id={scannerContainerId} className="w-full" />
          </div>

          <button
            onClick={() => {
              if (scannerRef.current) scannerRef.current.stop().catch(() => {});
              setMode('manual');
            }}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <Keyboard size={14} />
            Enter code manually instead
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            On your other device, go to <strong>Transfer Identity &rarr; Send from here</strong> and copy the session code.
          </p>

          <form onSubmit={handleManualSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste session code"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground/60 mb-3"
            />

            <button
              type="submit"
              disabled={!code.trim()}
              className={cn(
                'w-full h-11 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2',
                !code.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark'
              )}
            >
              Receive Identity
            </button>
          </form>

          <button
            onClick={() => setMode('scan')}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 mt-2"
          >
            <Camera size={14} />
            Scan QR code instead
          </button>
        </>
      )}
    </div>
  );
}
