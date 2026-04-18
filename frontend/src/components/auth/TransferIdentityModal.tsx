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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Transfer Identity</h2>
            <p className="text-xs text-muted-foreground">Move your identity between devices</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
          <button
            onClick={() => setTab('send')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === 'send' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Send from here
          </button>
          <button
            onClick={() => setTab('receive')}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === 'receive' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Receive here
          </button>
        </div>

        {tab === 'send' ? <SendTab /> : <ReceiveTab />}
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
      <div className="text-center py-4">
        <Smartphone size={48} className="mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground mb-5">
          Generate a QR code on this device. Scan it on your other device to transfer your identity.
        </p>
        <button
          onClick={initiate}
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
        >
          Generate QR Code
        </button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="text-center py-8">
        <Loader2 size={32} className="mx-auto mb-3 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Generating transfer session...</p>
      </div>
    );
  }

  if (status === 'awaiting_approval') {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-amber-600" />
        </div>
        <p className="font-semibold text-lg mb-1">Approve Transfer?</p>
        <p className="text-sm text-muted-foreground mb-5">
          Another device scanned your QR code and wants to receive your identity.
        </p>
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex gap-3 justify-center">
          <button
            onClick={initiate}
            className="px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Deny
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            {approving ? <Loader2 size={14} className="animate-spin" /> : null}
            Approve Transfer
          </button>
        </div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="text-center py-6">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <Check size={28} className="text-green-600" />
        </div>
        <p className="font-semibold text-lg mb-1">Transfer Complete!</p>
        <p className="text-sm text-muted-foreground">Your identity is now active on the other device.</p>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="text-center py-6">
        <p className="font-semibold mb-2">Session Expired</p>
        <p className="text-sm text-muted-foreground mb-4">The QR code has expired. Generate a new one.</p>
        <button
          onClick={initiate}
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-red-500 mb-4">{error}</p>
        <button
          onClick={initiate}
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Waiting — show QR code + session ID for manual fallback
  const sessionId = session?.session_id || '';

  return (
    <div className="text-center py-2">
      <div className="inline-block p-4 bg-white rounded-2xl border border-border mb-4">
        {session && (
          <QRCodeSVG
            value={session.qr_data}
            size={200}
            level="M"
            bgColor="#ffffff"
            fgColor="#171717"
          />
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Loader2 size={14} className="animate-spin text-primary" />
        <p className="text-sm font-medium">Waiting for scan...</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Open YoTop10 on your other device and scan this code.
        <br />
        Expires in 5 minutes.
      </p>

      {/* Manual fallback: show session ID */}
      <div className="border-t border-border pt-3 mt-1">
        <p className="text-[11px] text-muted-foreground mb-1.5">Or enter this code manually:</p>
        <button
          onClick={() => { navigator.clipboard.writeText(sessionId); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-mono tracking-wide hover:bg-muted/80 transition-colors"
          title="Click to copy"
        >
          {sessionId.slice(0, 8)}...{sessionId.slice(-4)}
          <span className="text-[10px] text-muted-foreground">(tap to copy)</span>
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
