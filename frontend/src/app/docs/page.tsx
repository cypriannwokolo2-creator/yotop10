import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';

export const metadata: Metadata = {
  title: 'Docs & Legal — YoTop10',
  description: 'Terms, privacy policy, guides, and how-to articles for YoTop10.',
};

const LEGAL = [
  { icon: 'FileText' as const, label: 'Terms of Use', href: '/docs/terms', description: 'Rules and guidelines for using YoTop10' },
  { icon: 'Shield' as const, label: 'Privacy Policy', href: '/docs/privacy', description: 'How we collect, use, and protect your data' },
  { icon: 'Cookie' as const, label: 'Cookie Policy', href: '/docs/cookies', description: 'What cookies we use and how to manage them' },
];

const GUIDES = [
  { icon: 'Compass' as const, label: 'How YoTop10 Works', href: '/docs/guides/overview', description: 'A quick overview of everything you can do' },
  { icon: 'Star' as const, label: 'Reputation System', href: '/docs/guides/reputation', description: 'How trust scores and reputation work' },
  { icon: 'Swords' as const, label: 'Arguments & Debates', href: '/docs/guides/arguments', description: 'How to start and participate in debates' },
  { icon: 'PenLine' as const, label: 'Posting a List', href: '/docs/guides/posting', description: 'Step-by-step guide to creating your first list' },
  { icon: 'Folder' as const, label: 'Categories', href: '/docs/guides/categories', description: 'Browse and discover content by topic' },
  { icon: 'Crown' as const, label: 'Hall of Fame', href: '/docs/guides/hall-of-fame', description: 'The best lists curated by the community' },
  { icon: 'FileText' as const, label: 'Articles', href: '/docs/guides/articles', description: 'Long-form knowledge pieces and fact-checks' },
  { icon: 'Bookmark' as const, label: 'Saved Posts', href: '/docs/guides/saved', description: 'Save and organize posts for later' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="max-w-3xl mx-auto px-5 py-10 sm:px-8 sm:py-14">
        <nav className="mb-6">
          <Link href="/settings" className="text-sm text-orange-400 hover:text-orange-300 transition">
            &larr; Back to Settings
          </Link>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Docs & Legal</h1>
        <p className="text-zinc-500 text-base mb-10">Everything you need to know about using YoTop10.</p>

        {/* Legal */}
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
            <Icon name="Scale" size={14} />
            Legal
          </h2>
          <div className="space-y-2">
            {LEGAL.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4 transition hover:border-orange-500/20 hover:bg-white/[0.06]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 shrink-0">
                  <Icon name={item.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">{item.description}</p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-zinc-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Guides */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
            <Icon name="BookOpen" size={14} />
            Guides
          </h2>
          <div className="space-y-2">
            {GUIDES.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4 transition hover:border-orange-500/20 hover:bg-white/[0.06]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400 shrink-0">
                  <Icon name={item.icon} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">{item.description}</p>
                </div>
                <Icon name="ChevronRight" size={16} className="text-zinc-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
