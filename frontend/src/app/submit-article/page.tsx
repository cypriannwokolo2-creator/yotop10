import type { Metadata } from 'next';
import SubmitArticleClient from './client';
import { buildWebsiteMetadata } from '@/lib/seo/metadata';

export const runtime = 'nodejs';

export const metadata: Metadata = buildWebsiteMetadata({
  path: '/submit-article',
  title: 'Submit an Article',
  description: 'Write a sourced, long-form article for YoTop10. Cover art, citations, and admin review included.',
});

export default function SubmitArticlePage() {
  return <SubmitArticleClient />;
}
