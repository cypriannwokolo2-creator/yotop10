import { ImageResponse } from 'next/og';
import { API } from '@/lib/api';
import { ogFonts } from '@/lib/seo/ogFonts';
import { LightFrame, LogoMark, TrustBadge, LightHeadline, RankRow, titleSize, truncate } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'Ranked list, debate, or fact drop on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yotop10.com';

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

function absoluteImage(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default async function Image({ params }: { params: { slug: string } }) {
  const slug = String(params.slug);
  let title = truncate(slug.replace(/-/g, ' '), 120);
  let topItems: Array<{ rank: number; title: string }> = [];
  let category = '';
  let postType = '';
  let hero: string | null = null;

  try {
    const data = await API.getPost(slug, { noCount: true });
    title = data.post.title || title;
    topItems = (data.items || []).slice(0, 3);
    category = data.post.category_name || data.post.category_slug || '';
    postType = data.post.post_type || '';
    if (data.post.hero_image_url) hero = absoluteImage(data.post.hero_image_url);
  } catch {
    /* fall back to slug-derived title */
  }

  const badge = POST_TYPE_LABEL[postType] || (postType ? postType.replace(/_/g, ' ') : '');

  return new ImageResponse(
    (
      <LightFrame>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '50px 30px 50px 60px', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LogoMark />
            {badge ? <TrustBadge level="ghost" label={badge} /> : null}
          </div>
          <LightHeadline size={titleSize(title)}>{title}</LightHeadline>
          {category ? (
            <div style={{ fontSize: 20, fontWeight: 400, color: '#6b7280' }}>{category} · yotop10.com</div>
          ) : null}
          {topItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topItems.map((item, i) => (
                <RankRow key={i} rank={item.rank} title={item.title} />
              ))}
            </div>
          ) : null}
        </div>
        {hero ? (
          <div style={{ display: 'flex', width: 440, height: 630, padding: 36, alignItems: 'center', justifyContent: 'center' }}>
            <img src={hero} width={368} height={558} style={{ objectFit: 'cover', borderRadius: 24 }} />
          </div>
        ) : null}
      </LightFrame>
    ),
    {
      width: 1200,
      height: 630,
      fonts: ogFonts,
      headers: { 'Cache-Control': 'public, immutable, no-transform, max-age=31536000' },
    },
  );
}
