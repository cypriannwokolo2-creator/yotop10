import { PostCarouselCard } from '@/components/PostCarouselCard';
import { Icon } from '@/components/icons/Icon';
import type { PostsResponse } from '@/lib/api/types';

interface DesktopCarouselProps {
  posts: PostsResponse['posts'];
}

export function DesktopCarousel({ posts }: DesktopCarouselProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
          <Icon name="FileText" size={24} className="text-zinc-600" />
        </div>
        <h3 className="mb-2 text-base font-semibold text-zinc-300">No ranked lists yet.</h3>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6">
      <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-6 snap-x scroll-smooth scrollbar-hide items-stretch">
        {posts.map((post) => (
          <div key={post.id} className="flex-shrink-0 snap-start h-full w-[calc((100%_-_1.5rem)/3)]">
            <PostCarouselCard post={post} />
          </div>
        ))}
      </div>
    </div>
  );
}
