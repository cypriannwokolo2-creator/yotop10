'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function StatusModal({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  actionLabel = 'Got it',
  onAction,
}: StatusModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="text-green-500" size={48} />,
    error: <AlertCircle className="text-red-500" size={48} />,
    info: <Info className="text-blue-500" size={48} />,
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center transition-all duration-300 transform',
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="mb-6 animate-in zoom-in duration-500 delay-150 fill-mode-both">
          {icons[type]}
        </div>

        <h3 className="text-2xl font-black tracking-tight mb-3">
          {title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed mb-8">
          {message}
        </p>

        <button
          onClick={() => {
            if (onAction) onAction();
            onClose();
          }}
          className={cn(
            'w-full h-14 rounded-2xl text-white font-bold text-lg shadow-lg transition-transform active:scale-95 hover:brightness-110',
            colors[type]
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
