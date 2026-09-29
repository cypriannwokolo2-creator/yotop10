import Link from 'next/link';

/**
 * Brand mark matching cypriannwokolo2-creator/yotop10 ui/Logo:
 * red rounded square with 5 stacked white bars.
 * Top 2 bars are shorter (75%) and RIGHT-aligned, bottom 3 full width.
 */
const BARS = [
  { x: 13, y: 3, w: 20 },
  { x: 13, y: 10, w: 20 },
  { x: 7, y: 17, w: 26 },
  { x: 7, y: 24, w: 26 },
  { x: 7, y: 31, w: 26 },
] as const;

const BAR_H = 5.8;

export function LogoMark({ height = 28, className = '' }: { height?: number; className?: string }) {
  const width = (height * 40) / 40;
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="YoTop10 logo"
      className={`shrink-0 ${className}`}
    >
      {BARS.map((bar) => (
        <rect key={bar.y} x={bar.x} y={bar.y} width={bar.w} height={BAR_H} rx={1.5} fill="#dc2626" />
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
    <Link href="/" className={`flex items-center gap-2.5 shrink-0 ${className}`} aria-label="YoTop10 home">
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
