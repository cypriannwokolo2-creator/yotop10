import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full h-11 px-4 rounded-xl border bg-background text-sm transition-colors appearance-none cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-ring/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error ? 'border-destructive focus:ring-destructive/30' : 'border-border',
        // Custom arrow
        'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%239ca3af%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_12px_center]',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);

Select.displayName = 'Select';
export { Select };
