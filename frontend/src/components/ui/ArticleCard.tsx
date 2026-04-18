'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, Share2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';

interface ArticleCardProps {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishedAt: string;
  readTime: number;
  tags: Array<{ label: string; variant?: 'default' | 'featured' }>;
  thumbnail?: string;
  viewCount?: string;
  className?: string;
}

export default function ArticleCard({
  slug,
  title,
  excerpt,
  author,
  readTime,
  tags,
  thumbnail,
  viewCount,
  className,
}: ArticleCardProps) {
  return (
    <article
      className={cn(
        'bg-muted/50 rounded-2xl border border-border overflow-hidden',
        'hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative w-full aspect-[16/10] bg-muted">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          />
          {/* Read time badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-medium">
            <Clock size={12} />
            {readTime} min
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, idx) => (
            <Badge
              key={idx}
              variant={tag.variant === 'featured' ? 'warning' : 'default'}
              className={cn(
                tag.variant === 'featured' && 'bg-amber-100 text-amber-700 border-amber-200'
              )}
            >
              {tag.label}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <Link href={`/${slug}`}>
          <h3 className="font-bold text-base leading-snug mb-2 hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{excerpt}</p>

        {/* Author & Meta */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
            <User size={12} className="text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">By {author.name}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground">{viewCount}</span>
            <button className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <Share2 size={14} className="text-muted-foreground" />
            </button>
          </div>
          <Link href={`/${slug}`}>
            <Button size="sm" className="h-8 px-4 rounded-full bg-green-500 hover:bg-green-600 text-white">
              Read
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
