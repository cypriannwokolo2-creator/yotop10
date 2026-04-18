'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdmin } from '@/context/AdminAuthContext';
import { LayoutDashboard, CheckSquare, FolderGit2, LogOut, Settings, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/ui/Logo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = useAdmin();
  const pathname = usePathname();

  // Skip auth check for login and setup pages
  const isPublicRoute = pathname === '/admin/login' || pathname.startsWith('/admin/setup');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  // Pure layout for unprotected admin routes
  if (isPublicRoute) {
    return <div className="min-h-screen bg-muted/20">{children}</div>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pending Approvals', href: '/admin/posts/pending', icon: CheckSquare },
    { name: 'Add Free List', href: '/admin/posts/create', icon: PlusCircle },
    { name: 'Categories', href: '/admin/categories', icon: FolderGit2 },
  ];

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border md:min-h-screen flex flex-col">
        <div className="p-6 border-b border-border">
          <Logo size="md" />
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-semibold">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-muted/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Settings size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{admin?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Superadmin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
