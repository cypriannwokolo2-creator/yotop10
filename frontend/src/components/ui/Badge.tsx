import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors',
        variant === 'default' && 'bg-muted text-muted-foreground',
        variant === 'primary' && 'bg-primary/10 text-primary',
        variant === 'success' && 'bg-green-50 text-green-700',
        variant === 'warning' && 'bg-amber-50 text-amber-700',
        variant === 'destructive' && 'bg-red-50 text-red-700',
        variant === 'outline' && 'border border-border text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
