import Link from 'next/link';
import { useId } from 'react';

const BARS = [
  { x: 20, y: 2, w: 24, h: 8 },
  { x: 12, y: 13, w: 24, h: 8 },
  { x: 4, y: 24, w: 40, h: 8 },
  { x: 4, y: 35, w: 40, h: 8 },
  { x: 4, y: 46, w: 40, h: 8 },
] as const;

export function LogoMark({ height = 28, className = '' }: { height?: number; className?: string }) {
  const gradientId = `yotop10-mark-${useId().replace(/:/g, '')}`;
  const width = (height * 48) / 56;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 48 56"
      fill="none"
      role="img"
      aria-label="YoTop10 logo"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="6" y1="2" x2="42" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb923c" />
          <stop offset="0.55" stopColor="#f97316" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      {BARS.map((bar) => (
        <rect key={bar.y} x={bar.x} y={bar.y} width={bar.w} height={bar.h} rx={4} fill={`url(#${gradientId})`} />
      ))}
    </svg>
  );
}

interface LogoProps {
  markHeight?: number;
  showWordmark?: boolean;
  textSize?: string;
  className?: string;
}

export function Logo({ markHeight = 28, showWordmark = true, textSize = 'text-xl', className = '' }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 shrink-0 ${className}`} aria-label="YoTop10 home">
      <LogoMark height={markHeight} />
      {showWordmark && (
        <span className="flex items-baseline gap-0">
          <span className={`font-accent gradient-text ${textSize} tracking-normal`}>YO</span>
          <span className={`font-display ${textSize} tracking-tight text-white`}>Top10</span>
        </span>
      )}
    </Link>
  );
}
