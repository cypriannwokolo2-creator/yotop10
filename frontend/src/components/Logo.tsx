import Link from 'next/link';

/**
 * Brand mark — pixel-matched to public/icon-512.png (the favicon).
 * 5 rounded bars on a 512px grid, scaled into a 40x40 viewBox (x40/512):
 * top 2 bars are shorter and right-aligned, bottom 3 are wider; every bar
 * shares the same right edge (30.55). Fill #d24924 is sampled from the PNG.
 */
const BARS = [
  { x: 15, y: 1.8, w: 15.55, h: 6.02 },
  { x: 15, y: 8.83, w: 15.55, h: 6.09 },
  { x: 8.44, y: 15.94, w: 22.11, h: 6.72 },
  { x: 8.44, y: 23.59, w: 22.11, h: 6.8 },
  { x: 8.44, y: 31.41, w: 22.11, h: 7.27 },
] as const;

const BAR_FILL = '#d24924';

/** Corner radius sampled from the favicon: 17px on a 512px grid. */
const BAR_RADIUS = 0.22;

/** Slides the short top bars left until they line up with the wide ones. */
const BAR_ACTIVE_X = -(15 - 8.44);

const BAR_TRANSITION = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)';

export function LogoMark({
  height = 28,
  className = '',
  active = false,
}: {
  height?: number;
  className?: string;
  active?: boolean;
}) {
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
      {BARS.map((bar, index) => {
        const isTopBar = index < 2;
        return (
          <rect
            key={bar.y}
            x={bar.x}
            y={bar.y}
            width={bar.w}
            height={bar.h}
            rx={bar.h * BAR_RADIUS}
            fill={BAR_FILL}
            style={
              isTopBar
                ? {
                    transform: active ? `translateX(${BAR_ACTIVE_X}px)` : 'translateX(0)',
                    transition: BAR_TRANSITION,
                    transitionDelay: index === 1 ? '70ms' : '0ms',
                  }
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}

interface LogoProps {
  markHeight?: number;
  showWordmark?: boolean;
  showMark?: boolean;
  textSize?: string;
  className?: string;
  markActive?: boolean;
}

export function Logo({
  markHeight = 28,
  showWordmark = true,
  showMark = true,
  textSize = 'text-xl',
  className = '',
  markActive = false,
}: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 shrink-0 ${className}`} aria-label="YoTop10 home">
      {showMark && <LogoMark height={markHeight} active={markActive} />}
      {showWordmark && (
        <span className="flex items-baseline gap-0">
          <span className={`font-accent gradient-text ${textSize} tracking-normal`}>YO</span>
          <span className={`font-display ${textSize} tracking-tight text-white`}>Top10</span>
        </span>
      )}
    </Link>
  );
}
