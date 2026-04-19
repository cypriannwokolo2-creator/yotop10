'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Monitor, 
  Smartphone, 
  Laptop, 
  Trash2, 
  LogOut, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  History
} from 'lucide-react';
import { API, type UserSession } from '@/lib/api';
import { cn } from '@/lib/utils';

interface DeviceManagerProps {
  onClose: () => void;
}

export default function DeviceManager({ onClose }: DeviceManagerProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await API.getUserSessions();
      setSessions(data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await API.revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      setMessage({ type: 'success', text: 'Device signed out successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to sign out device' });
    } finally {
      setRevokingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm('This will sign you out of all other devices. Continue?')) return;
    setRevokingOthers(true);
    try {
      await API.revokeAllOtherSessions();
      setSessions(prev => prev.filter(s => s.is_current));
      setMessage({ type: 'success', text: 'Signed out of all other devices' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to sign out other devices' });
    } finally {
      setRevokingOthers(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('android') || l.includes('iphone') || l.includes('mobile')) return Smartphone;
    if (l.includes('windows') || l.includes('mac') || l.includes('linux')) return Laptop;
    return Monitor;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative my-auto bg-card/95 backdrop-blur-xl border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] rounded-[2rem] w-full max-w-lg p-8 overflow-y-auto max-h-[calc(100dvh-2rem)] ring-1 ring-white/10 custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-all active:scale-90 z-10"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
            <Monitor size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="font-black text-xl tracking-tight">Active Sessions</h2>
            <p className="text-xs font-medium text-muted-foreground">Manage your connected devices</p>
          </div>
        </div>

        {message && (
          <div className={cn(
            "mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2",
            message.type === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 w-full bg-muted/50 rounded-2xl animate-pulse" />
            ))
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground font-medium">No active sessions found</p>
            </div>
          ) : (
            sessions.map((session) => {
              const Icon = getDeviceIcon(session.device_label);
              return (
                <div 
                  key={session.session_id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all",
                    session.is_current ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/30 border-border/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      session.is_current ? "bg-primary text-white" : "bg-background text-muted-foreground"
                    )}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm tracking-tight">{session.device_label}</p>
                        {session.is_current && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">Active Now</span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Last active {new Date(session.last_active).toLocaleDateString()} at {new Date(session.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {!session.is_current && (
                    <button
                      onClick={() => handleRevoke(session.session_id)}
                      disabled={revokingId === session.session_id}
                      className="p-2.5 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                      title="Revoke session"
                    >
                      {revokingId === session.session_id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <LogOut size={18} />
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeOthers}
            disabled={revokingOthers}
            className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold text-sm border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {revokingOthers ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            Sign Out All Other Devices
          </button>
        )}
      </div>
    </div>
  );
}
