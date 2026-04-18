'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) {
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

  return (
    <div
      className={cn(
        'fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-300',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Card */}
      <div
        className={cn(
          'relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 transition-all duration-300 transform',
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        )}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-0"
        >
          <X size={18} className="text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={cn(
            'w-16 h-16 rounded-3xl flex items-center justify-center mb-6 shadow-inner',
            variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
          )}>
            {variant === 'danger' ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
          </div>

          <h3 className="text-2xl font-black tracking-tight mb-3">
            {title}
          </h3>
          
          <p className="text-muted-foreground leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                'w-full h-14 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2',
                variant === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-primary hover:bg-primary-dark shadow-primary/20'
              )}
            >
              {isLoading && <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5" />}
              {confirmLabel}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full h-14 rounded-2xl bg-muted text-foreground font-bold text-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
