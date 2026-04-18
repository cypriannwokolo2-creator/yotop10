'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { API } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifications = async () => {
    try {
      const data = await API.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await API.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    try {
      await API.clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-muted transition-colors relative group"
      >
        <Bell size={20} className={cn('text-muted-foreground transition-colors', unreadCount > 0 && 'text-primary')} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[380px] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-black text-lg tracking-tight">Intelligence Alerts</h3>
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-16 px-10 text-center">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                  <Bell size={32} />
                </div>
                <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                  The signal is quiet. No new alerts for your identity.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-5 transition-colors group relative",
                      !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                    )}
                  >
                    {!n.read && (
                      <button 
                        onClick={() => handleMarkRead(n.id)}
                        className="absolute top-5 right-5 p-1.5 rounded-lg bg-card border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                        title="Mark as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    
                    <div className="flex gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        n.type === 'approved' ? "bg-green-500/10 text-green-500" : 
                        n.type === 'rejected' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                      )}>
                        {n.type === 'approved' ? <CheckCircle2 size={20} /> : 
                         n.type === 'rejected' ? <AlertCircle size={20} /> : <Info size={20} />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">
                          Moderation Result
                        </p>
                        <h4 className="font-bold text-sm mb-1 truncate leading-tight">
                          {n.post_title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {n.message}
                        </p>
                        
                        {n.reason && (
                          <div className="p-3 bg-muted/50 rounded-xl border border-border/50 text-[11px] leading-relaxed italic text-muted-foreground mb-3">
                            <span className="font-bold not-italic block mb-1 text-[9px] uppercase tracking-tighter">Feedback from Admin:</span>
                            "{n.reason}"
                          </div>
                        )}
                        
                        <span className="text-[10px] font-mono opacity-40">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-muted/10 border-t border-border text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-30">
              Yo!Top10 Security Mesh
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
