import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-12 px-4', className)}>
      {icon && (
        <div className="mx-auto mb-4 text-muted-foreground/40">
          {icon}
        </div>
      )}
      <p className="font-semibold text-lg mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
