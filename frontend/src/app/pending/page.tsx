import type { Metadata } from 'next';
import PendingClient from './client';

export const metadata: Metadata = {
  title: 'Post Pending Review — YoTop10',
  description: 'Your post was received and is now pending review by the moderation team.',
  robots: { index: false, follow: true },
};

export default function PendingPage() {
  return <PendingClient />;
}
