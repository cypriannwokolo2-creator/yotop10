'use client';

import { useState } from 'react';
import TransferIdentityModal from '@/components/auth/TransferIdentityModal';
import DeviceManager from '@/components/auth/DeviceManager';
import UserMenu from '@/components/auth/UserMenu';

export default function AuthPreviewPage() {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDevices, setShowDevices] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Auth UI Preview</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Dev-only page to preview auth modals without a running backend.
      </p>

      {/* UserMenu preview */}
      <div className="mb-8 p-6 border border-border rounded-2xl bg-card">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">User Menu (Header)</p>
        <div className="flex justify-end">
          <UserMenu username="a_demo" />
        </div>
      </div>

      {/* Individual modal triggers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => setShowTransfer(true)}
          className="p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-center"
        >
          <p className="font-semibold text-sm mb-1">QR Transfer</p>
          <p className="text-xs text-muted-foreground">Send / Receive tabs</p>
        </button>

        <button
          onClick={() => setShowDevices(true)}
          className="p-4 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-center"
        >
          <p className="font-semibold text-sm mb-1">Device Manager</p>
          <p className="text-xs text-muted-foreground">Active sessions</p>
        </button>
      </div>

      {/* Modals */}
      {showTransfer && <TransferIdentityModal onClose={() => setShowTransfer(false)} />}
      {showDevices && <DeviceManager onClose={() => setShowDevices(false)} />}
    </div>
  );
}
