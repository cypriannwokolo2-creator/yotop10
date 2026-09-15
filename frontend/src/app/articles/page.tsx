import { Suspense } from 'react';
import { API } from '@/lib/api';
import type { Article } from '@/lib/api/types';
import { ArticlesSkeleton } from '@/components/ArticlesSkeleton';
import ArticlesClient from './client';
import type { Metadata } from 'next';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/articles',
  title: 'Articles',
  description: 'Long-form, sourced articles. Deep dives with cover art and citations across every topic on YoTop10.',
});

const PAGE_SIZE = 10;

async function ArticlesFeed() {
  let articles: Article[] = [];
  let hasMore = false;

  try {
    const data = await API.getArticles({ page: 1, limit: PAGE_SIZE });
    articles = data.articles || [];
    const totalPages = data.pagination?.totalPages || 1;
    hasMore = 1 < totalPages;
  } catch {}

  return <ArticlesClient initialArticles={articles} initialHasMore={hasMore} />;
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<ArticlesSkeleton />}>
      <ArticlesFeed />
    </Suspense>
  );
}
