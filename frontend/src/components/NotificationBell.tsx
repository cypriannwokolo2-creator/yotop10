'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { relativeTime } from '@/lib/dates';
import { Icon, type LucideIconName } from './icons/Icon';

interface NotificationItem {
  _id: string;
  type: 'post_approved' | 'post_rejected' | 'revision_requested' | 'admin_message';
  post_id?: string;
  post_title?: string;
  message?: string;
  title?: string;
  body?: string;
  priority?: string;
  message_type?: string;
  created_by?: string;
  is_admin?: boolean;
  read: boolean;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  post_approved: 'Check',
  post_rejected: 'X',
  revision_requested: 'RefreshCw',
  admin_message: 'Mail',
  article_approved: 'Check',
  article_rejected: 'X',
  post_edited: 'Pencil',
  article_edited: 'Pencil',
};

const PRIORITY_CLASSES: Record<string, string> = {
  info: 'bg-blue-500/10 border-blue-500/30',
  important: 'bg-orange-500/10 border-orange-500/30',
  urgent: 'bg-red-500/10 border-red-500/30',
};

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const data = await apiFetch<{ count: number }>('/users/me/notifications/unread-count');
      setUnreadCount(data.count || 0);
    } catch { /* not authenticated — ignore */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>(
        '/users/me/notifications?limit=10&unread=true'
      );
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    const onNotifChange = () => fetchCount();
    window.addEventListener('notifications-changed', onNotifChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-changed', onNotifChange);
    };
  }, [fetchCount]);

  const handleClick = async (n: NotificationItem) => {
    setOpen(false);
    if (n.is_admin || n.type === 'admin_message') {
      try { await apiFetch(`/users/me/messages/${n._id}/dismiss`, { method: 'PATCH' }); } catch {}
    } else {
      try { await apiFetch(`/users/me/notifications/${n._id}/read`, { method: 'PATCH' }); } catch {}
    }
    setNotifications((prev) => prev.filter((x) => x._id !== n._id));
    fetchCount();
    router.push(`/notifications/${n._id}`);
  };

  const handleBellClick = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const handleDismissAdmin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await apiFetch(`/users/me/messages/${id}/dismiss`, { method: 'PATCH' });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchCount();
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/users/me/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleBellClick}
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border cursor-pointer transition ${
          unreadCount > 0
            ? 'bg-orange-500/10 border-orange-500/25'
            : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Icon name="Bell" size={18} color={unreadCount > 0 ? '#f97316' : '#888'} strokeWidth={2.25} />
        {unreadCount > 0 && (
          <span aria-hidden className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[var(--color-bg)]" />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[99]"
            onClick={() => setOpen(false)}
          />
          <div className="pop-in fixed top-[60px] right-3 sm:right-5 w-[400px] max-w-[calc(100vw-1.5rem)] max-h-[70vh] bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/5 bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2">
                <strong className="text-white text-sm font-semibold">Notifications</strong>
                {unreadCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-orange-500/15 text-orange-500 text-2xs font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="bg-transparent border-none text-orange-500 cursor-pointer text-xs font-medium hover:text-orange-400 transition px-0 py-0"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 px-4 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
                    <Icon name="Bell" size={20} className="text-zinc-500" />
                  </span>
                  <p className="text-sm text-zinc-500">No notifications yet</p>
                  <p className="text-xs text-zinc-600 max-w-[16rem]">Approval updates and admin messages will land here.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const isAdmin = n.is_admin || n.type === 'admin_message';
                  const pc = PRIORITY_CLASSES[n.priority || 'info'];
                  return (
                    <div
                      key={n._id}
                      onClick={() => handleClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors ${
                        isAdmin
                          ? `${pc} border-l-[3px]`
                          : n.read
                            ? 'hover:bg-white/5'
                            : 'bg-white/5 hover:bg-white/[0.07] border-l-[3px] border-l-orange-500/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                          !n.read && !isAdmin
                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                            : 'bg-white/5 border-white/10 text-zinc-400'
                        }`}
                      >
                        <Icon name={(TYPE_ICON[n.type] || 'Pin') as LucideIconName} size={14} />
                      </span>

                      <div className="min-w-0 flex-1">
                        {isAdmin ? (
                          <>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <strong className="text-sm2 font-semibold text-white">{n.title}</strong>
                              {n.priority && n.priority !== 'info' && (
                                <span className="rounded-full px-1.5 py-px text-2xs font-bold uppercase tracking-wider text-white bg-orange-500">
                                  {n.priority.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed text-zinc-400 mt-1">
                              {n.body?.substring(0, 100)}{(n.body?.length || 0) > 100 ? '...' : ''}
                            </p>
                            <p className="text-2xs text-zinc-600 mt-1 flex items-center gap-1">
                              {n.created_by} · {n.message_type === 'broadcast'
                                ? <><Icon name="Megaphone" size={10} /> Broadcast</>
                                : <><Icon name="User" size={10} /> Private</>}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={`text-sm leading-relaxed ${n.read ? 'text-zinc-500' : 'text-white font-medium'}`}>
                              {n.message}
                            </p>
                            <p className="text-2xs text-zinc-600 mt-1" suppressHydrationWarning>
                              {relativeTime(n.created_at)}
                            </p>
                          </>
                        )}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={(e) => handleDismissAdmin(e, n._id)}
                          className="bg-transparent border-none text-zinc-500 cursor-pointer px-1 py-0 shrink-0 hover:text-white transition rounded"
                          aria-label="Dismiss" title="Dismiss"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 bg-white/[0.02] px-4 py-2.5 text-center shrink-0">
              <Link href="/notifications" className="inline-flex items-center gap-1.5 text-sm2 font-medium text-orange-500 no-underline hover:text-orange-400 transition" onClick={() => setOpen(false)}>
                See all notifications <Icon name="ArrowRight" size={13} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
