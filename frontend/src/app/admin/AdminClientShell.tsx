'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';

interface AdminData {
  id: string;
  username: string;
  role: string;
  permissions: string[];
}

export default function AdminClientShell({
  admin,
  children,
}: {
  admin: AdminData;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (active: boolean) =>
    `block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
      active ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:text-white hover:bg-white/5'
    }`;

  const nav = (href: string, label: string, icon?: string) => (
    <button
      onClick={() => { router.push(href); setMobileOpen(false); }}
      className={linkClass(
        pathname === href ||
          (href !== '/admin' && pathname.startsWith(href + '/')) ||
          (href === '/admin/posts/pending' && pathname.startsWith('/admin/posts/pending'))
      )}
    >
      <span className="flex items-center gap-2">
        {icon && <Icon name={icon as any} size={15} />}
        {label}
      </span>
    </button>
  );

  const hasPermission = (perm: string) =>
    admin.role === 'super_admin' || admin.permissions.includes(perm);

  const sidebarNav = (
    <>
      {nav('/admin', 'Dashboard', 'LayoutDashboard')}
      {hasPermission('posts:read') && nav('/admin/posts/pending', 'Pending Posts', 'Clock')}
      {hasPermission('posts:read') && nav('/admin/posts', 'All Posts', 'FileText')}
      {hasPermission('comments:read') && nav('/admin/comments', 'Comments', 'MessageCircle')}
      {hasPermission('users:read') && nav('/admin/users', 'Users', 'Users')}
      {hasPermission('categories:read') && nav('/admin/categories', 'Categories', 'FolderTree')}
      {hasPermission('statistics:read') && nav('/admin/statistics', 'Statistics', 'BarChart3')}
      {hasPermission('alerts:read') && nav('/admin/alerts', 'Alerts', 'BellDot')}
      {hasPermission('notifications:read') && nav('/admin/notifications', 'Notifications', 'Mail')}
      {hasPermission('search:read') && nav('/admin/search', 'Search', 'Search')}
      {hasPermission('hof:read') && nav('/admin/hall-of-fame', 'Hall of Fame', 'Star')}
          {hasPermission('audit:read') && nav('/admin/audit', 'Audit Logs', 'ClipboardList')}
          {hasPermission('queries:read') && nav('/admin/queries', 'Queries', 'MessageSquareWarning')}
      {hasPermission('mods:manage') && nav('/admin/settings/mods', 'Moderators', 'Shield')}
      {admin.role === 'super_admin' && nav('/admin/settings/rate-limits', 'Rate Limits', 'Gauge')}
      {admin.role === 'super_admin' && nav('/admin/settings/ai-moderation', 'AI Moderation', 'Bot')}
    </>
  );

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-12 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white/70 hover:text-white p-1">
            <Icon name={mobileOpen ? 'X' : 'Menu'} size={20} />
          </button>
          <span className="text-white font-bold text-sm">YoTop10 <span className="text-zinc-500 font-normal">Admin</span></span>
        </div>
        <span className="text-zinc-500 text-xs">{admin.username}</span>
      </div>

      {/* Mobile slide-out menu */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="lg:hidden fixed top-12 left-0 bottom-0 z-50 w-64 bg-zinc-950 border-r border-white/10 overflow-y-auto py-3 px-3 space-y-0.5">
            {sidebarNav}
            <hr className="border-white/10 my-3" />
            {nav('/admin/profile', 'Profile', 'User')}
            <button
              onClick={async () => {
                const { API } = await import('@/lib/api');
                await API.adminLogout();
                router.push('/admin/login');
              }}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <span className="flex items-center gap-2"><Icon name="LogOut" size={15} /> Logout</span>
            </button>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-[220px] min-h-screen border-r border-white/10 bg-zinc-950/80 backdrop-blur-sm flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-white font-bold text-base tracking-tight">
            YoTop10 <span className="text-zinc-500 font-normal">Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {sidebarNav}
        </nav>

        <div className="px-3 py-3 border-t border-white/10 space-y-1">
          {nav('/admin/profile', 'Profile', 'User')}
          <button
            onClick={async () => {
              const { API } = await import('@/lib/api');
              await API.adminLogout();
              router.push('/admin/login');
            }}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2"><Icon name="LogOut" size={15} /> Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 pt-16 lg:pt-6 overflow-auto">{children}</div>
    </div>
  );
}
