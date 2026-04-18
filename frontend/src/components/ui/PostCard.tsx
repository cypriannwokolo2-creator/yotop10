'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MoreHorizontal, MessageCircle, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { Badge } from './Badge';

interface ListItem {
  rank: number;
  title: string;
}

interface PostCardProps {
  id: string;
  slug: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    verified?: boolean;
  };
  createdAt: string;
  title: string;
  description: string;
  items: ListItem[];
  image?: string;
  engagementScore?: number;
  commentCount?: number;
  reactionCount?: number;
  className?: string;
}

export default function PostCard({
  slug,
  author,
  createdAt,
  title,
  description,
  items,
  image,
  engagementScore,
  commentCount = 0,
  reactionCount = 0,
  className,
}: PostCardProps) {
  const timeAgo = formatTimeAgo(createdAt);
  const displayItems = items.slice(0, 3);
  const remainingCount = Math.max(0, items.length - 3);

  return (
    <article className={cn('bg-card rounded-2xl border border-border overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Avatar username={author.username} size="md" />
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">{author.displayName}</span>
              {author.verified && (
                <Badge variant="primary" className="!px-1 !py-0">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </Badge>
              )}
              <span className="text-muted-foreground text-xs">• {timeAgo}</span>
            </div>
          </div>
          <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontal size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Title & Description */}
        <Link href={`/${slug}`}>
          <h3 className="font-bold text-base leading-snug mb-1.5 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>

        {/* Ranked Items */}
        <div className="space-y-2">
          {displayItems.map((item) => (
            <div key={item.rank} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
                #{item.rank}
              </div>
              <span className="text-sm font-medium">{item.title}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <p className="text-sm text-muted-foreground pl-10">
              ... and {remainingCount} more items
            </p>
          )}
        </div>
      </div>

      {/* Image */}
      {image && (
        <div className="relative w-full aspect-video">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Heart size={16} />
            <span>{reactionCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <MessageCircle size={16} />
            <span>{commentCount}</span>
          </button>
        </div>
        {engagementScore !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Engagement</span>
            <span className="text-sm font-bold text-primary">{engagementScore}%</span>
          </div>
        )}
      </div>
    </article>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
