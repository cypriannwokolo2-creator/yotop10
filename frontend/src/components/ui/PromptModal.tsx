'use client';

import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Zap,
  SendHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  quickReplies?: { label: string; message: string }[];
  isLoading?: boolean;
}

export default function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = 'Type your reason here...',
  confirmLabel = 'Send & Confirm',
  quickReplies = [],
  isLoading = false,
}: PromptModalProps) {
  const [reason, setReason] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setMounted(false);
        setReason(''); // Reset
      }, 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInstantSend = (tempReason: string) => {
    setReason(tempReason);
    onConfirm(tempReason);
  };

  if (!mounted && !isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full max-w-xl bg-card border border-border/50 rounded-[3rem] shadow-2xl p-10 transition-all duration-500 transform',
          isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-12 opacity-0'
        )}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X size={20} className="text-muted-foreground" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">{title}</h3>
              <p className="text-muted-foreground text-sm">{message}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Quick Replies Grid */}
            {quickReplies.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Auto-Reasoning
                  </label>
                  <div className="flex items-center gap-1 text-[9px] text-primary font-bold">
                    <Zap size={10} /> Double-click for Instant Reject
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReason(reply.message)}
                      onDoubleClick={() => handleInstantSend(reply.message)}
                      className={cn(
                        "group relative px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2",
                        reason === reply.message 
                          ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20" 
                          : "bg-muted/50 text-muted-foreground border-border hover:border-red-500/50 hover:text-red-500"
                      )}
                    >
                      {reply.label}
                      <span 
                        onClick={(e) => { e.stopPropagation(); handleInstantSend(reply.message); }}
                        className="ml-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-md bg-white/20 hover:bg-white/40 transition-opacity"
                        title="Send Instantly"
                      >
                        <SendHorizontal size={10} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Custom Feedback
              </label>
              <div className="relative">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={placeholder}
                  className="w-full p-6 rounded-3xl border border-border bg-muted/20 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all min-h-[160px] text-lg leading-relaxed font-medium"
                ></textarea>
                <div className="absolute top-6 right-6 text-red-500/20">
                  <MessageSquare size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={() => onConfirm(reason)}
              disabled={isLoading || !reason.trim()}
              className="flex-1 h-16 bg-red-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-red-600/20 hover:scale-[1.02] active:scale-95 hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <span className="animate-spin border-4 border-white/20 border-t-white rounded-full w-6 h-6" />
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  {confirmLabel}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-8 h-16 bg-muted text-foreground rounded-2xl font-black text-xl hover:bg-muted/80 transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
