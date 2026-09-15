import { ImageResponse } from 'next/og';
import { API } from '@/lib/api';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { LightFrame, LogoMark, TrustBadge, LightHeadline, LightSubtext, titleSize, truncate } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'Sourced long-form article on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yotop10.com';

function absoluteImage(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const slug = String(params.slug);
  let title = truncate(slug.replace(/-/g, ' '), 120);
  let author = '';
  let category = '';
  let readingTime = 0;
  let cover: string | null = null;

  try {
    const data = await API.getArticle(slug, { noCount: true });
    title = data.article.title || title;
    author = data.article.author_display_name || data.article.author_username || '';
    category = data.article.category_name || data.article.category_slug || '';
    const words = (data.article.body || '').split(/\s+/).filter(Boolean).length;
    readingTime = Math.max(1, Math.ceil(words / 265));
    if (data.article.cover_image) cover = absoluteImage(data.article.cover_image);
  } catch {
    /* fall back to slug-derived title */
  }

  const byline = [author ? `By ${author}` : '', category, readingTime > 0 ? `${readingTime} min read` : ''].filter(Boolean).join(' · ');

  return new ImageResponse(
    (
      <LightFrame>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '50px 30px 50px 60px', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LogoMark />
            <TrustBadge level="neutral" label="Article" />
          </div>
          <LightHeadline size={titleSize(title)}>{title}</LightHeadline>
          {byline ? <LightSubtext>{byline}</LightSubtext> : null}
        </div>
        {cover ? (
          <div style={{ display: 'flex', width: 440, height: 630, padding: 36, alignItems: 'center', justifyContent: 'center' }}>
            <img src={cover} width={368} height={558} style={{ objectFit: 'cover', borderRadius: 24 }} />
          </div>
        ) : null}
      </LightFrame>
    ),
    {
      width: 1200,
      height: 630,
      fonts: ogSansFonts,
      headers: { 'Cache-Control': 'public, immutable, no-transform, max-age=31536000' },
    },
  );
}
