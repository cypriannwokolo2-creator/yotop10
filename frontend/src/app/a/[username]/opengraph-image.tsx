import { ImageResponse } from 'next/og';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { OGFrame, OGHeader, OGFooter, truncate } from '@/lib/seo/ogImageLayout';
import { toPublicSlug } from '@/lib/username';

export const runtime = 'nodejs';
export const alt = 'User profile on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

interface SitemapUser {
  username: string;
  custom_display_name?: string | null;
  bio?: string | null;
  trust_score?: number;
  trust_level?: string;
}

export default async function Image({ params }: { params: { username: string } }) {
  const { username } = params;
  const apiBase = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
  let displayName = username;
  let bio = '';
  let stats = '';
  let trust = '';

  try {
    const res = await fetch(`${apiBase}/users/${username}`, { cache: 'no-store' });
    if (res.ok) {
      const u = (await res.json()) as SitemapUser & {
        stats?: { total_posts?: number; total_comments?: number };
      };
      displayName = u.custom_display_name || u.username || username;
      bio = (u.bio || '').slice(0, 140);
      const posts = u.stats?.total_posts ?? 0;
      const comments = u.stats?.total_comments ?? 0;
      stats = `${posts} lists · ${comments} comments`;
      if (typeof u.trust_score === 'number') trust = `${u.trust_score.toFixed(1)} trust`;
      else if (u.trust_level) trust = u.trust_level;
    }
  } catch {
    /* fall back to username-only card */
  }

  const publicSlug = toPublicSlug(displayName);
  const initial = (displayName || 'U').replace(/^a_/, '').charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <OGFrame accent="purple">
        <OGHeader badge="Profile" badgeAccent="purple" right={`yotop10.com/a/${publicSlug}`} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 20 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 700,
              color: 'white',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            }}
          >
            {initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 52, fontWeight: 700, color: '#f4f4f5', lineHeight: 1.1 }}>{truncate(displayName, 26)}</div>
            {(stats || trust) && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                {stats ? <span style={{ fontSize: 20, fontWeight: 400, color: '#a1a1aa' }}>{stats}</span> : null}
                {trust ? (
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'rgba(167, 139, 250, 0.15)',
                      border: '1px solid rgba(167, 139, 250, 0.3)',
                      color: '#a78bfa',
                    }}
                  >
                    {trust}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
        {bio ? (
          <div style={{ fontSize: 22, fontWeight: 400, color: '#d4d4d8', lineHeight: 1.4, overflow: 'hidden', lineClamp: 2 }}>
            {bio}
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
