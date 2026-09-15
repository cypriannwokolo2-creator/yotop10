import { API } from '@/lib/api';
import type { Post } from '@/lib/api/types';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CategoryFeedClient from './client';
import { absoluteUrl } from '@/lib/urls';
import { buildWebsiteMetadata, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  post_count: number;
  children: Array<{ id: string; name: string; slug: string; post_count: number }>;
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slugParam = resolvedParams.slug;
  const slug = slugParam ? slugParam.join('/') : '';
  if (!slug) return { title: 'Category Not Found' };
  try {
    const catData = await API.getCategory(slug) as { category: Category };
    const cat = catData.category;
    const description = cat.description?.slice(0, 200) || `Browse ${cat.post_count} ${cat.name} lists and debates on YoTop10.`;
    return buildWebsiteMetadata({
      path: `/c/${slug}`,
      title: cat.name,
      description,
      image: {
        url: absoluteUrl(`/og/category?slug=${encodeURIComponent(slug)}`),
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: `${cat.name} — YoTop10`,
        type: 'image/png',
      },
    });
  } catch {
    return { title: 'Category Not Found' };
  }
}

export default async function CategoryFeedPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slugParam = resolvedParams.slug;
  const slug = slugParam ? slugParam.join('/') : '';

  if (!slug) return null;

  let category: Category | null = null;
  let posts: Post[] = [];
  let hasMore = false;

  try {
    const [catData, postsData] = await Promise.all([
      API.getCategory(slug) as Promise<{ category: Category }>,
      API.getPosts({ category: slug, page: 1, limit: 20 }) as Promise<{ posts: Post[]; pagination?: { page: number; totalPages: number } }>,
    ]);
    category = catData.category;
    posts = postsData.posts || [];
    hasMore = (postsData.pagination?.totalPages ?? 1) > 1;
  } catch {
    notFound();
  }

  return <CategoryFeedClient slug={slug} initialCategory={category} initialPosts={posts} initialHasMore={hasMore} />;
}
