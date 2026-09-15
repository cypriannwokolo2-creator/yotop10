import { ImageResponse } from 'next/og';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { OGFrame, OGHeader, OGFooter, truncate } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'YoTop10 — Fact Mine. Debate Ground.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 300;

export default async function Image() {
  const apiBase = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
  let titles: string[] = [];

  try {
    const res = await fetch(`${apiBase}/posts?limit=6`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      titles = ((data.posts || []) as Array<{ title: string }>)
        .map((p) => p.title)
        .filter(Boolean)
        .slice(0, 6);
    }
  } catch {
    /* fall back to brand-only card */
  }

  const rows: string[][] = [];
  for (let i = 0; i < titles.length; i += 3) rows.push(titles.slice(i, i + 3));

  return new ImageResponse(
    (
      <OGFrame accent="orange">
        <OGHeader />
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
          <span style={{ fontSize: 64, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.1 }}>Fact Mine.</span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              background: 'linear-gradient(135deg, #f97316, #ec4899)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Debate Ground.
          </span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 400, color: '#a1a1aa', marginBottom: 24 }}>
          Ranked lists, head-to-head debates, and sourced facts — ranked in the open.
        </div>
        {rows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 10 }}>
                {row.map((t, ci) => (
                  <div
                    key={ci}
                    style={{
                      display: 'flex',
                      flex: 1,
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: 17,
                      fontWeight: 400,
                      color: '#d4d4d8',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {truncate(t, 34)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
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
