import { ImageResponse } from 'next/og';
import { ogSansFonts } from '@/lib/seo/ogFonts';
import { LightFrame, DomainPill, LightHeadline, CtaPill, LIGHT } from '@/lib/seo/ogImageLayout';

export const runtime = 'nodejs';
export const alt = 'YoTop10 — Fact Mine. Debate Ground.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 3600;

const BAR_WIDTHS = [150, 190, 250, 235, 265];

export default async function Image() {
  return new ImageResponse(
    (
      <LightFrame>
        <div style={{ display: 'flex', width: 460, height: 630, alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 30% 70%, #ffe4dc 0%, #ffffff 65%)' }}>
          <div style={{ display: 'flex', transform: 'rotate(-6deg)', background: 'rgba(255,255,255,0.7)', border: '3px solid #ffffff', borderRadius: 28, padding: '44px 40px', boxShadow: '0 20px 60px rgba(232,73,43,0.18)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              {BAR_WIDTHS.map((w, i) => (
                <div key={i} style={{ width: w, height: 44, borderRadius: 22, background: LIGHT.bar }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, padding: '0 70px 0 30px', gap: 26 }}>
          <div style={{ display: 'flex' }}>
            <DomainPill />
          </div>
          <LightHeadline>YoTop10 — Fact Mine. Debate Ground.</LightHeadline>
          <div style={{ display: 'flex' }}>
            <CtaPill tone="black">Join the Fun!</CtaPill>
          </div>
        </div>
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
