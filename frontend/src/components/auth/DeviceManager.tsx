'use client';

import { useState, useEffect } from 'react';
import { X, Smartphone, Monitor, Tablet, Loader2, Trash2, LogOut } from 'lucide-react';
import { API, type DeviceSession } from '@/lib/api';
import { signOutOtherDevices } from '@/lib/auth';

interface DeviceManagerProps {
  onClose: () => void;
}

function getDeviceIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('android') || lower.includes('iphone') || lower.includes('ios')) {
    return <Smartphone size={18} />;
  }
  if (lower.includes('ipad') || lower.includes('tablet')) {
    return <Tablet size={18} />;
  }
  return <Monitor size={18} />;
}

export default function DeviceManager({ onClose }: DeviceManagerProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.getActiveSessions()
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setError('Failed to load devices'))
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const res = await API.revokeSession(sessionId);
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      }
    } catch {
      setError('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    setError('');
    const success = await signOutOtherDevices();
    if (success) {
      setSessions((prev) => prev.filter((s) => s.is_current));
    } else {
      setError('Failed to sign out other devices');
    }
    setRevokingAll(false);
  };

  const otherDevices = sessions.filter((s) => !s.is_current);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Monitor size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Active Devices</h2>
            <p className="text-xs text-muted-foreground">Manage where you are signed in</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 size={24} className="mx-auto animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading devices...</p>
          </div>
        ) : error && sessions.length === 0 ? (
          <p className="text-sm text-red-500 text-center py-4">{error}</p>
        ) : (
          <>
            {sessions.filter((s) => s.is_current).map((session) => (
              <div
                key={session.session_id}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-3"
              >
                <div className="text-primary">{getDeviceIcon(session.device_label)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.device_label}</p>
                  <p className="text-xs text-muted-foreground">This device - Active now</p>
                </div>
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Current
                </span>
              </div>
            ))}

            {otherDevices.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3 mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Other Devices ({otherDevices.length})
                  </p>
                  <button
                    onClick={handleRevokeAll}
                    disabled={revokingAll}
                    className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    {revokingAll ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <LogOut size={12} />
                    )}
                    Sign out all
                  </button>
                </div>

                <div className="space-y-2">
                  {otherDevices.map((session) => (
                    <div
                      key={session.session_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border"
                    >
                      <div className="text-muted-foreground">{getDeviceIcon(session.device_label)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.device_label}</p>
                        <p className="text-xs text-muted-foreground">
                          Last active: {new Date(session.last_active).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRevoke(session.session_id)}
                        disabled={revoking === session.session_id}
                        className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Sign out this device"
                      >
                        {revoking === session.session_id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {otherDevices.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 mt-2">
                No other devices signed in.
              </p>
            )}

            {error && sessions.length > 0 && (
              <p className="text-sm text-red-500 text-center mt-3">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
