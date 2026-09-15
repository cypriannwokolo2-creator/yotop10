import { ImageResponse } from 'next/og';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { LogoMark, TrustBadge, LightHeadline, LightSubtext, CtaPill, truncate } from '@/lib/seo/ogImageLayout';
import { toPublicSlug } from '@/lib/username';

export const runtime = 'nodejs';
export const alt = 'User profile on YoTop10';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

interface ProfileUser {
  username: string;
  custom_display_name?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  trust_level?: string;
  stats?: { total_posts?: number; total_comments?: number };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.yotop10.com';

function absoluteImage(url: string): string | null {
  if (!/\.(jpe?g|png|gif)(\?|#|$)/i.test(url)) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default async function Image({ params }: { params: { username: string } }) {
  const { username } = params;
  const apiBase = process.env.INTERNAL_API_URL || 'http://backend:8000/api';
  let displayName = username;
  let statsLine = '';
  let trustLevel = 'neutral';
  let photo: string | null = null;

  try {
    const res = await fetch(`${apiBase}/users/${username}`, { cache: 'no-store' });
    if (res.ok) {
      const u = (await res.json()) as ProfileUser;
      displayName = u.custom_display_name || u.username || username;
      const posts = u.stats?.total_posts ?? 0;
      const comments = u.stats?.total_comments ?? 0;
      statsLine = `Posts and debates by ${toPublicSlug(displayName)} — ${posts} lists, ${comments} comments.`;
      trustLevel = (u.trust_level || 'neutral').toLowerCase();
      if (u.profile_image_url) photo = absoluteImage(u.profile_image_url);
    }
  } catch {
    /* fall back to username-only card */
  }

  const initial = (displayName || 'U').replace(/^a_/, '').charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: 1200, height: 630, background: '#ffffff', fontFamily: 'Geist Sans, sans-serif', overflow: 'hidden' }}>
        <div style={{ display: 'flex', height: 8, background: 'linear-gradient(90deg, #facc15 0%, #4ade80 50%, #2dd4bf 100%)' }} />
        <div style={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 640, padding: '0 20px 0 70px', gap: 22 }}>
            <LogoMark />
            <div style={{ display: 'flex' }}>
              <TrustBadge level={trustLevel} label={trustLevel} />
            </div>
            <LightHeadline size={56}>{truncate(`${displayName} on YoTop10`, 44)}</LightHeadline>
            {statsLine ? <LightSubtext>{statsLine}</LightSubtext> : null}
            <div style={{ display: 'flex' }}>
              <CtaPill tone="red">Join the fun!</CtaPill>
            </div>
          </div>
          <div style={{ display: 'flex', position: 'relative', width: 560, height: 622, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', position: 'absolute', top: 110, left: 60, width: 240, height: 240, borderRadius: 120, background: '#fde8d3' }} />
            <div style={{ display: 'flex', position: 'relative', width: 300, height: 300, borderRadius: 150, background: '#eef1f7', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {photo ? (
                <img src={photo} width={300} height={300} style={{ objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 130, fontWeight: 700, color: '#111111' }}>{initial}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: ogSansFonts,
      headers: { 'Cache-Control': 'public, immutable, no-transform, max-age=31536000' },
    },
  );
}
