import type { Metadata } from 'next';
import CategoriesClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/categories',
  title: 'Categories',
  description: 'Browse all categories. Discover ranked lists, debates, fact drops, and more across every topic on YoTop10.',
});

export default function CategoriesPage() {
  return <CategoriesClient />;
}
