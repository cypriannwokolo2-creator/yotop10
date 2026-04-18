import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Size applies to the generated favicon image
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ef4444', // Tailwind primary (red-500 equivalent)
          borderRadius: '8px',
        }}
      >
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
    ),
    { ...size }
  );
}
