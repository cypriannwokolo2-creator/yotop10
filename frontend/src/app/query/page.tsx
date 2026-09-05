import type { Metadata } from 'next';
import QueryClient from './client';

export const metadata: Metadata = {
  title: 'Feature Requests & Bug Reports — YoTop10',
  description: 'Tell us what you\'d like to see or what\'s broken. We read every message.',
};

export default function QueryPage() {
  return <QueryClient />;
}
