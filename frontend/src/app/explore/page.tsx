import type { Metadata } from 'next';
import { API } from '@/lib/api';
import type { ExplorePost } from '@/lib/api/types';
import ExploreClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

const PER_PAGE = 10;

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/explore',
  title: 'Explore',
  description: 'Discover trending lists, debates, and fact drops. Find something new every day on YoTop10.',
});

export default async function ExplorePage() {
  let posts: ExplorePost[] = [];
  let hasMore = false;

  try {
    const data = await API.getExplore(1, PER_PAGE);
    posts = data.posts || [];
    hasMore = 1 < (data.pagination?.totalPages || 1);
  } catch {}

  return <ExploreClient initialPosts={posts} initialHasMore={hasMore} />;
}
