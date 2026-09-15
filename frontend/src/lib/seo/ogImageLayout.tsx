export const OG_ACCENTS = {
  orange: { text: '#f97316', bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)' },
  green: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  purple: { text: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.3)' },
  blue: { text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' },
} as const;

export type OgAccent = keyof typeof OG_ACCENTS;

export const OG_GRADIENTS: Record<OgAccent, string> = {
  orange: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a0a 50%, #0f0a1a 100%)',
  green: 'linear-gradient(135deg, #0a0a0f 0%, #0f1a0a 50%, #0a0f1a 100%)',
  purple: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a1f 50%, #0a0f1a 100%)',
  blue: 'linear-gradient(135deg, #0a0a0f 0%, #0a1420 50%, #0a0f1a 100%)',
};

const WORDMARK_GRADIENT = 'linear-gradient(135deg, #f97316, #ec4899)';

export function OGFrame({ accent, children }: { accent: OgAccent; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: OG_GRADIENTS[accent],
        color: 'white',
        padding: 60,
        fontFamily: 'Geist Sans, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

export function OGHeader({ badge, badgeAccent = 'orange', right }: { badge?: string; badgeAccent?: OgAccent; right?: string }) {
  const a = OG_ACCENTS[badgeAccent];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          background: WORDMARK_GRADIENT,
          backgroundClip: 'text',
          color: 'transparent',
          letterSpacing: '0.02em',
        }}
      >
        YOTOP10
      </span>
      {badge ? (
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 6,
            background: a.bg,
            border: `1px solid ${a.border}`,
            color: a.text,
            textTransform: 'uppercase',
          }}
        >
          {badge}
        </span>
      ) : null}
      {right ? (
        <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 400, color: '#a1a1aa' }}>{right}</span>
      ) : null}
    </div>
  );
}

export function OGTitle({ children, size = 48, clamp = 3 }: { children: React.ReactNode; size?: number; clamp?: 2 | 3 | 4 }) {
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.15,
        margin: 0,
        marginBottom: 24,
        color: '#f4f4f5',
        overflow: 'hidden',
        lineClamp: clamp,
      }}
    >
      {children}
    </div>
  );
}

export function OGSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 20, fontWeight: 400, color: '#a1a1aa', lineHeight: 1.4, overflow: 'hidden', lineClamp: 2 }}>
      {children}
    </div>
  );
}

export function OGRankList({ items, accent = 'orange' }: { items: Array<{ rank: number | string; title: string }>; accent?: OgAccent }) {
  const a = OG_ACCENTS[accent];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Geist Mono, monospace',
              background: a.bg,
              color: a.text,
            }}
          >
            {item.rank}
          </span>
          <span style={{ fontSize: 20, color: '#d4d4d8', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {truncate(item.title, 52)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OGFooter({ left = 'YoTop10 — Fact Mine. Debate Ground.', right = 'yotop10.com' }: { left?: string; right?: string }) {
  return (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: 20,
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 14,
        color: '#52525b',
      }}
    >
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export function titleSize(title: string): number {
  if (title.length > 110) return 36;
  if (title.length > 70) return 44;
  return 52;
}
