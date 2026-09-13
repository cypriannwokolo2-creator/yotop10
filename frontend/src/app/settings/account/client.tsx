'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { SecureMyAuthority } from '@/components/SecureMyAuthority';
import { API } from '@/lib/api';

export default function AccountSettingsClient() {
  const authUser = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const fetchAuthUser = useAuthStore(s => s.fetchUser);

  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(authUser?.custom_display_name || '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState((authUser as unknown as { bio?: string })?.bio || '');
  const [bioError, setBioError] = useState<string | null>(null);
  const [editingLinks, setEditingLinks] = useState(false);
  const [links, setLinks] = useState({
    medium: (authUser as unknown as { links?: { medium?: string } })?.links?.medium || '',
    x: (authUser as unknown as { links?: { x?: string } })?.links?.x || '',
    github: (authUser as unknown as { links?: { github?: string } })?.links?.github || '',
  });
  const [linksError, setLinksError] = useState<string | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleUpdateName = async () => {
    if (!newDisplayName.trim()) return;
    try {
      await API.updateDisplayName(newDisplayName);
      await fetchAuthUser();
      setEditingName(false);
      setNameError(null);
    } catch {
      setNameError('Failed to update display name.');
    }
  };

  const handleUpdateBio = async () => {
    if (bio.length > 500) {
      setBioError('Bio must be 500 characters or less');
      return;
    }
    try {
      await (API as unknown as { updateBio: (bio: string) => Promise<unknown> }).updateBio(bio);
      await fetchAuthUser();
      setEditingBio(false);
      setBioError(null);
    } catch {
      setBioError('Failed to update bio.');
    }
  };

  const handleUpdateLinks = async () => {
    try {
      await (API as unknown as { updateLinks: (links: Record<string, string>) => Promise<unknown> }).updateLinks({
        medium: links.medium.trim().toLowerCase().replace(/^@/, ''),
        x: links.x.trim().toLowerCase().replace(/^@/, ''),
        github: links.github.trim().toLowerCase().replace(/^@/, ''),
      });
      await fetchAuthUser();
      setEditingLinks(false);
      setLinksError(null);
    } catch (e) {
      setLinksError(e instanceof Error ? e.message : 'Failed to update links.');
    }
  };

  const handleLogout = async () => {
    await logout();
    // Force hard redirect to clear all React state + trigger fresh fingerprint
    window.location.href = '/';
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 min-h-[calc(100vh-56px)]">
      <nav className="mb-6">
        <Link href="/settings" className="text-sm text-orange-400 hover:text-orange-300 transition">
          &larr; Back to Settings
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-white mb-8">Account Settings</h1>

      <div className="space-y-6">
        {/* Display Name */}
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-5 py-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Display Name</h2>
          {editingName ? (
            <div className="space-y-3">
              {nameError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{nameError}</div>
              )}
              <input
                value={newDisplayName}
                onChange={e => setNewDisplayName(e.target.value)}
                placeholder={authUser?.username || 'display name'}
                maxLength={32}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateName} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-xl">
                  Save
                </button>
                <button onClick={() => setEditingName(false)} className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-xs font-medium text-zinc-400 transition hover:text-orange-400">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{authUser?.custom_display_name || authUser?.username || 'Anonymous'}</p>
                <p className="text-2xs text-zinc-600 mt-0.5">Shown on your posts and comments</p>
              </div>
              <button onClick={() => setEditingName(true)} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-400 transition hover:text-orange-400">
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-5 py-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Bio</h2>
          {editingBio ? (
            <div className="space-y-3">
              {bioError && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{bioError}</div>}
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="What do you rank? e.g. Top 10 horror obsessive"
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none resize-y"
              />
              <div className="flex items-center justify-between">
                <span className="text-2xs text-zinc-600">{bio.length}/500</span>
                <div className="flex gap-2">
                  <button onClick={handleUpdateBio} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-xs font-semibold text-white">Save</button>
                  <button onClick={() => setEditingBio(false)} className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-xs font-medium text-zinc-400">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white whitespace-pre-wrap break-words">{(authUser as unknown as { bio?: string })?.bio || 'No bio yet'}</p>
                <p className="text-2xs text-zinc-600 mt-1">Shown on your profile — optional</p>
              </div>
              <button onClick={() => setEditingBio(true)} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-400">Edit</button>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="rounded-xl border border-white/5 bg-white/[0.03] px-5 py-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Links</h2>
          {editingLinks ? (
            <div className="space-y-3">
              {linksError && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">{linksError}</div>}
              <div>
                <label className="block text-2xs text-zinc-600 mb-1">Medium — medium.com/@</label>
                <input value={links.medium} onChange={e => setLinks({ ...links, medium: e.target.value })} placeholder="nekwasar" maxLength={32} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-2xs text-zinc-600 mb-1">X (Twitter) — x.com/</label>
                <input value={links.x} onChange={e => setLinks({ ...links, x: e.target.value })} placeholder="nekwasar" maxLength={32} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="block text-2xs text-zinc-600 mb-1">GitHub — github.com/</label>
                <input value={links.github} onChange={e => setLinks({ ...links, github: e.target.value })} placeholder="nekwasar" maxLength={39} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:outline-none" />
              </div>
              <p className="text-2xs text-zinc-600">Just your handle, not full URL</p>
              <div className="flex gap-2">
                <button onClick={handleUpdateLinks} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-xs font-semibold text-white">Save</button>
                <button onClick={() => setEditingLinks(false)} className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-xs font-medium text-zinc-400">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {(authUser as unknown as { links?: { medium?: string; x?: string; github?: string } })?.links?.medium ||
                (authUser as unknown as { links?: { x?: string } })?.links?.x ||
                (authUser as unknown as { links?: { github?: string } })?.links?.github ? (
                  <div className="flex flex-wrap gap-2">
                    {(authUser as unknown as { links?: { medium?: string } })?.links?.medium && <span className="text-xs text-zinc-400">medium.com/@{(authUser as unknown as { links: { medium: string } }).links.medium}</span>}
                    {(authUser as unknown as { links?: { x?: string } })?.links?.x && <span className="text-xs text-zinc-400">x.com/{(authUser as unknown as { links: { x: string } }).links.x}</span>}
                    {(authUser as unknown as { links?: { github?: string } })?.links?.github && <span className="text-xs text-zinc-400">github.com/{(authUser as unknown as { links: { github: string } }).links.github}</span>}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600">No links yet</p>
                )}
                <p className="text-2xs text-zinc-600 mt-1">Shown as links on your profile</p>
              </div>
              <button onClick={() => setEditingLinks(true)} className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-400">Edit</button>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] px-5 py-5">
          <h2 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Logout</h2>
          <p className="text-2xs text-zinc-600 mb-4">
            Clears your session and generates a new anonymous identity. Your existing posts and comments remain linked to your current identity.
          </p>
          {confirmLogout ? (
            <div className="flex items-center gap-3">
              <button onClick={handleLogout} className="rounded-xl bg-red-500 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600">
                Confirm Logout
              </button>
              <button onClick={() => setConfirmLogout(false)} className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-xs font-medium text-zinc-400 transition hover:text-zinc-200">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmLogout(true)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20">
              Logout &amp; Reset Identity
            </button>
          )}
        </div>

        {/* Transfer Identity */}
        <div className="rounded-xl border border-orange-500/10 bg-orange-500/[0.02] px-5 py-5">
          <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">Transfer Identity</h2>
          <p className="text-2xs text-zinc-600 mb-4">
            Generate a seed phrase to transfer your identity to another device or browser.
          </p>
          <SecureMyAuthority />
        </div>

        {/* Recover Identity — always visible */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Recover Identity</h2>
          <p className="text-2xs text-zinc-600 mb-4">
            Already have a 12-word seed phrase? Use it to recover your identity on this device. All your posts, comments, and reputation will be restored.
          </p>
          <Link
            href="/claim"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:shadow-xl active:scale-[0.98]"
          >
            Recover Identity &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
