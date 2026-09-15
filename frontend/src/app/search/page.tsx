import type { Metadata } from 'next';
import SearchClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/search',
  title: 'Search',
  description: 'Search ranked lists, debates, fact drops, and articles across all categories on YoTop10.',
  robots: { index: false, follow: true },
});

export default function SearchPage() {
  return <SearchClient />;
}
