'use client';

import { useState, useEffect } from 'react';

interface ArgumentBarProps {
  supportPct: number;
  contradictPct: number;
  className?: string;
}

export function ArgumentBar({ supportPct, contradictPct, className }: ArgumentBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isZero = supportPct === 0 && contradictPct === 0;

  if (isZero) {
    return (
      <div className={className}>
        <div className="h-1.5 rounded-full bg-white/5" />
        <div className="text-[10px] text-zinc-600 mt-1">No votes yet</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/5 flex gap-px">
        <div
          className="h-full bg-emerald-500/70 transition-all duration-700 ease-out rounded-l-full"
          style={{ width: mounted ? `${supportPct}%` : '0%' }}
        />
        <div
          className="h-full bg-red-500/70 transition-all duration-700 ease-out rounded-r-full"
          style={{ width: mounted ? `${contradictPct}%` : '0%' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] font-mono text-emerald-500/70 tabular-nums">{supportPct}%</span>
        <span className="text-[10px] font-mono text-red-500/70 tabular-nums">{contradictPct}%</span>
      </div>
    </div>
  );
}
