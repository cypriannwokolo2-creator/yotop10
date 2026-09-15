import { ImageResponse } from 'next/og';
import { API } from '@/lib/api';
import { ogFonts } from '@/lib/seo/ogFonts';
import { OGFrame, OGHeader, OGTitle, OGRankList, OGFooter, titleSize, truncate } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'Ranked list, debate, or fact drop on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const POST_TYPE_LABEL: Record<string, string> = {
  top_list: 'Ranked List',
  this_vs_that: 'Debate',
  who_is_better: 'Debate',
  best_of: 'Best Of',
  worst_of: 'Worst Of',
  hidden_gems: 'Hidden Gems',
  counter_list: 'Counter',
  fact_drop: 'Fact',
  article: 'Article',
};

export default async function Image({ params }: { params: { slug: string } }) {
  const slug = String(params.slug);
  let title = truncate(slug.replace(/-/g, ' '), 120);
  let topItems: Array<{ rank: number; title: string }> = [];
  let category = '';
  let postType = '';

  try {
    const data = await API.getPost(slug, { noCount: true });
    title = data.post.title || title;
    topItems = (data.items || []).slice(0, 3);
    category = data.post.category_name || data.post.category_slug || '';
    postType = data.post.post_type || '';
  } catch {
    /* fall back to slug-derived title */
  }

  const badge = POST_TYPE_LABEL[postType] || (postType ? postType.replace(/_/g, ' ') : '');

  return new ImageResponse(
    (
      <OGFrame accent="orange">
        <OGHeader badge={badge || undefined} badgeAccent="orange" right={category || undefined} />
        <OGTitle size={titleSize(title)} clamp={3}>
          {title}
        </OGTitle>
        {topItems.length > 0 ? <OGRankList items={topItems} accent="orange" /> : null}
        <OGFooter />
      </OGFrame>
    ),
    {
      width: 1200,
      height: 630,
      fonts: ogFonts,
      headers: { 'Cache-Control': 'public, immutable, no-transform, max-age=31536000' },
    },
  );
}
