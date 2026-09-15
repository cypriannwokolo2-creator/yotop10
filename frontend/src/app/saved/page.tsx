import type { Metadata } from 'next';
import SavedClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/saved',
  title: 'Saved',
  description: 'Your saved lists, debates, and articles on YoTop10.',
  robots: { index: false, follow: true },
});

export default function SavedPage() {
  return <SavedClient />;
}
