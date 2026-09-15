import type { Metadata } from 'next';
import NotificationsClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/notifications',
  title: 'Notifications',
  description: 'Your notifications on YoTop10.',
  robots: { index: false, follow: true },
});

export default function NotificationsPage() {
  return <NotificationsClient />;
}
