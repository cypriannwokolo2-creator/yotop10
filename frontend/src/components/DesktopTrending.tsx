import Link from 'next/link';
import { Icon } from './icons/Icon';

export function DesktopTrending({ terms }: { terms: string[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="TrendingUp" size={16} className="text-orange-400" />
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trending Now</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {terms.map(term => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="rounded-full bg-white/5 border border-white/10 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/10 hover:border-orange-500/30 transition"
          >
            {term}
          </Link>
        ))}
      </div>
    </section>
  );
}
