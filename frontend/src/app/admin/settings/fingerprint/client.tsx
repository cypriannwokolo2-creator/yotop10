'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons/Icon';
import { apiFetch } from '@/lib/api';

export default function AdminFingerprintClient() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ fingerprint_enabled: boolean }>('/admin/settings/fingerprint')
      .then((data) => setEnabled(data.fingerprint_enabled))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setSaving(true);
    try {
      await apiFetch('/admin/settings/fingerprint', {
        method: 'PUT',
        body: JSON.stringify({ fingerprint_enabled: !enabled }),
      });
      setEnabled(!enabled);
    } catch {
      // ignore
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Icon name="Fingerprint" size={20} className="text-orange-400" />
          Device Fingerprinting
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Control how user identity is tracked across sessions.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Enable Device Fingerprinting</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              When enabled, users are identified by their device (WebGL, canvas, audio) instead of just a cookie.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enabled ? 'bg-orange-500' : 'bg-white/10'
            } ${saving ? 'opacity-50' : ''}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <Icon name="Check" size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-zinc-300 font-medium">When ON</p>
              <p className="text-xs text-zinc-500">Users are identified by device hardware. Clearing cookies does not create a new identity. Vote/view deduplication works correctly.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="X" size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-zinc-300 font-medium">When OFF</p>
              <p className="text-xs text-zinc-500">Users are identified by cookie only. Clearing cookies creates a new identity. Vulnerable to vote/view manipulation.</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-4 py-3 flex items-start gap-2">
          <Icon name="TriangleAlert" size={14} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-xs text-orange-300">
            <strong>Super admin only.</strong> This setting affects all users. Enable carefully — existing users with different cookies will be treated as the same device.
          </p>
        </div>
      </div>
    </div>
  );
}
