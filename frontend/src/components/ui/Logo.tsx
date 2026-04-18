import { cn } from '@/lib/utils';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

/**
 * Logo: Red rounded square with 5 stacked white bars.
 * Top 3 bars are full width, 4th is ~80%, 5th is ~60%.
 * All bars are center-aligned, creating a ranked-list visual.
 */
export default function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  // viewBox is always 40x40, scales via the container
  // 5 bars: Top 2 are shorter and RIGHT-aligned, bottom 3 are full width
  const vb = 40;
  const barH = 5.8;
  const gap = 1.2;
  const padX = 7;       // left padding for full-width bars
  const fullW = 26;     // narrower bars
  const shortW = Math.round(fullW * 0.75); // 75% of full width
  const rightEdge = padX + fullW; // right edge all bars align to

  const startY = 3;     // vertical offset to center the stack

  const bars = [
    { y: startY,                         w: shortW, x: rightEdge - shortW },  // bar 1 — short, right-aligned
    { y: startY + (barH + gap),          w: shortW, x: rightEdge - shortW },  // bar 2 — short, right-aligned
    { y: startY + (barH + gap) * 2,      w: fullW,  x: padX },               // bar 3 — full
    { y: startY + (barH + gap) * 3,      w: fullW,  x: padX },               // bar 4 — full
    { y: startY + (barH + gap) * 4,      w: fullW,  x: padX },               // bar 5 — full
  ];

  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      {/* Icon — red rounded square with 5 stacked bars */}
      <div className={cn('rounded-xl bg-primary flex items-center justify-center shadow-sm', iconSizes[size])}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${vb} ${vb}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {bars.map((bar, i) => (
            <rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={bar.w}
              height={barH}
              rx={1.5}
              fill="white"
            />
          ))}
        </svg>
      </div>

      {/* Text */}
      {showText && (
        <span className={cn('font-extrabold tracking-tight', textSizes[size])}>
          <span className="text-primary">YO</span>
          <span className="text-foreground">Top10</span>
        </span>
      )}
    </Link>
  );
}
