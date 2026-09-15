import { ImageResponse } from 'next/og';
import { API } from '@/lib/api';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { OGFrame, OGHeader, OGTitle, OGSubtitle, OGFooter, titleSize, truncate } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'Sourced long-form article on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({ params }: { params: { slug: string } }) {
  const slug = String(params.slug);
  let title = truncate(slug.replace(/-/g, ' '), 120);
  let author = '';
  let category = '';
  let readingTime = 0;

  try {
    const data = await API.getArticle(slug, { noCount: true });
    title = data.article.title || title;
    author = data.article.author_display_name || data.article.author_username || '';
    category = data.article.category_name || data.article.category_slug || '';
    const words = (data.article.body || '').split(/\s+/).filter(Boolean).length;
    readingTime = Math.max(1, Math.ceil(words / 265));
  } catch {
    /* fall back to slug-derived title */
  }

  const right = [category, readingTime > 0 ? `${readingTime} min read` : ''].filter(Boolean).join(' · ');

  return new ImageResponse(
    (
      <OGFrame accent="green">
        <OGHeader badge="Article" badgeAccent="green" />
        <OGTitle size={titleSize(title)} clamp={4}>
          {title}
        </OGTitle>
        {author ? <OGSubtitle>{`By ${author}${right ? ` · ${right}` : ''}`}</OGSubtitle> : null}
        <OGFooter />
      </OGFrame>
    ),
    {
      width: 1200,
      height: 630,
      fonts: ogSansFonts,
      headers: { 'Cache-Control': 'public, immutable, no-transform, max-age=31536000' },
    },
  );
}
