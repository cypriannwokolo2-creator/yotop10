import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 disabled:pointer-events-none',
          // Variants
          variant === 'primary' && 'bg-primary text-white hover:bg-primary-dark',
          variant === 'secondary' && 'bg-muted text-foreground hover:bg-muted/80',
          variant === 'outline' && 'border border-border bg-transparent hover:bg-muted',
          variant === 'ghost' && 'bg-transparent hover:bg-muted',
          variant === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90',
          // Sizes
          size === 'sm' && 'h-8 px-3 text-xs rounded-lg',
          size === 'md' && 'h-10 px-5 text-sm',
          size === 'lg' && 'h-12 px-8 text-base',
          size === 'icon' && 'h-10 w-10 p-0',
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
