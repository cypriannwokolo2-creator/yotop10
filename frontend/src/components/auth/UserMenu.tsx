'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Key, User, QrCode, ChevronDown, Monitor, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/PublicAuthContext';
import TransferIdentityModal from './TransferIdentityModal';
import DeviceManager from './DeviceManager';
import RecoveryModal from './RecoveryModal';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const username = user?.username || 'Guest';
  const [open, setOpen] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div ref={menuRef} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={13} className="text-primary" />
          </div>
          <span className="max-w-[100px] truncate">{username}</span>
          <ChevronDown size={12} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50">
            {/* Profile link */}
            <Link
              href={`/a/${username.replace(/^a_/, '')}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <User size={15} className="text-muted-foreground" />
              <span>My Profile</span>
            </Link>

            {/* Settings link */}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <Settings size={15} className="text-muted-foreground" />
              <span>Settings</span>
            </Link>


            {/* Transfer Identity */}
            <button
              onClick={() => { setShowTransfer(true); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left"
            >
              <QrCode size={15} className="text-muted-foreground" />
              <div>
                <span>Transfer Identity</span>
                <p className="text-[11px] text-muted-foreground">Move to another device</p>
              </div>
            </button>

            {/* Manage Devices */}
            <button
              onClick={() => { setShowDevices(true); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left"
            >
              <Monitor size={15} className="text-muted-foreground" />
              <div>
                <span>Active Devices</span>
                <p className="text-[11px] text-muted-foreground">Sign out other devices</p>
              </div>
            </button>


            {/* Backup Identity */}
            <button
              onClick={() => { setShowRecovery(true); setOpen(false); }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left border-t border-border mt-1.5 pt-3"
            >
              <Key size={15} className="text-primary" />
              <div>
                <span className="font-semibold text-primary">Backup Identity</span>
                <p className="text-[11px] text-muted-foreground">Get your recovery key</p>
              </div>
            </button>

            {/* Sign out this device */}
            <button
              onClick={() => {
                logout();
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors w-full text-left text-red-500"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTransfer && <TransferIdentityModal onClose={() => setShowTransfer(false)} />}
      {showDevices && <DeviceManager onClose={() => setShowDevices(false)} />}
      {showRecovery && <RecoveryModal onClose={() => setShowRecovery(false)} />}
    </>
  );
}
