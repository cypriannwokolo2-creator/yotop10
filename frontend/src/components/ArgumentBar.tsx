'use client';

interface ArgumentBarProps {
  supportPct: number;
  contradictPct: number;
  className?: string;
}

export function ArgumentBar({ supportPct, contradictPct, className }: ArgumentBarProps) {
  const total = supportPct + contradictPct;
  const isZero = total === 0;

  return (
    <div className={className}>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/5 flex gap-px">
        <div
          className="h-full bg-emerald-500/70 transition-all duration-300 ease-out rounded-l-full"
          style={{ width: isZero ? '50%' : `${supportPct}%` }}
        />
        <div
          className="h-full bg-red-500/70 transition-all duration-300 ease-out rounded-r-full"
          style={{ width: isZero ? '50%' : `${contradictPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-mono text-emerald-500/70 tabular-nums">{supportPct}%</span>
        <span className="text-[10px] font-mono text-red-500/70 tabular-nums">{contradictPct}%</span>
      </div>
    </div>
  );
}
