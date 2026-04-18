import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full min-h-[100px] px-4 py-3 rounded-xl border bg-background text-sm transition-colors resize-y',
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

Textarea.displayName = 'Textarea';
export { Textarea };
