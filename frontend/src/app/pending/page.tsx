import type { Metadata } from 'next';
import PendingClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/pending',
  title: 'Post Pending Review',
  description: 'Your post was received and is now pending review by the moderation team.',
  robots: { index: false, follow: true },
});

export default function PendingPage() {
  return <PendingClient />;
}
