import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-11 px-4 rounded-xl border bg-background text-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring/30',
        'placeholder:text-muted-foreground/60',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-destructive focus:ring-destructive/30' : 'border-border',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';
export { Input };
