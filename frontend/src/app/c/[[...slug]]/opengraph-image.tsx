import { ImageResponse } from 'next/og';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { OGFrame, OGHeader, OGTitle, OGSubtitle, OGRankList, OGFooter, titleSize, truncate } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'Browse category lists and debates on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Image({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug ? params.slug.join('/') : '';
  const apiBase = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
  let name = truncate(slug.replace(/-/g, ' '), 60) || 'Category';
  let description = '';
  let count = 0;
  let topTitles: Array<{ rank: number; title: string }> = [];

  try {
    const [catRes, postsRes] = await Promise.all([
      fetch(`${apiBase}/categories/${slug}`, { cache: 'no-store' }),
      fetch(`${apiBase}/posts?category=${encodeURIComponent(slug)}&limit=5`, { cache: 'no-store' }),
    ]);
    if (catRes.ok) {
      const catData = (await catRes.json()) as {
        category?: { name?: string; description?: string; post_count?: number };
      };
      const cat = catData.category;
      if (cat) {
        name = cat.name || name;
        description = (cat.description || '').slice(0, 160);
        count = cat.post_count ?? 0;
      }
    }
    if (postsRes.ok) {
      const postsData = (await postsRes.json()) as { posts?: Array<{ title: string }> };
      topTitles = ((postsData.posts || []).slice(0, 3)).map((p, i) => ({ rank: i + 1, title: p.title || '' }));
    }
  } catch {
    /* fall back to slug-derived card */
  }

  return new ImageResponse(
    (
      <OGFrame accent="blue">
        <OGHeader badge="Category" badgeAccent="blue" right={count > 0 ? `${count} lists` : undefined} />
        <OGTitle size={titleSize(name)} clamp={2}>
          {name}
        </OGTitle>
        {description ? <OGSubtitle>{description}</OGSubtitle> : null}
        {topTitles.length > 0 ? <OGRankList items={topTitles} accent="blue" /> : null}
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
