import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  username?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

const iconSizeMap = { sm: 12, md: 14, lg: 18 };

export function Avatar({ username, size = 'md', className }: AvatarProps) {
  const initial = username ? username.replace(/^a_/, '').charAt(0).toUpperCase() : '';

  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0',
        sizeMap[size],
        className
      )}
    >
      {username ? initial : <User size={iconSizeMap[size]} />}
    </div>
  );
}
