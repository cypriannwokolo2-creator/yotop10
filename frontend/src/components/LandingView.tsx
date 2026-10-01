'use client';

import { useEffect, useState } from 'react';
import { LandingHero } from '@/components/landing/LandingHero';
import { TrendingSlider } from '@/components/landing/TrendingSlider';
import { PopularPostsSlider } from '@/components/landing/PopularPostsSlider';
import { LandingMagazine } from '@/components/landing/LandingMagazine';
import { ShareModal, type ShareData } from '@/components/landing/ShareModal';
import { LandingTags } from '@/components/landing/LandingTags';
import { LandingNewsletter } from '@/components/landing/LandingNewsletter';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { ScrollToTop } from '@/components/landing/ScrollToTop';
import { LandingShareContext } from '@/components/landing/share-context';
import { landingSlots } from '@/components/landing/slots';
import type { LandingItem, LandingTag } from '@/components/landing/types';

interface LandingViewProps {
  items: LandingItem[];
  tags: LandingTag[];
}

export function LandingView({ items, tags }: LandingViewProps) {
  const [heroHidden, setHeroHidden] = useState(false);
  const [share, setShare] = useState<ShareData | null>(null);

  // Port of the hero vanish (script.js:877-899): once the user scrolls past
  // 20% of the hero, the hero is hidden for the rest of the session (latched)
  // and the trending section is snapped to the top of the viewport.
  useEffect(() => {
    const hero = document.getElementById('heroSection');
    const trending = document.getElementById('trending');
    if (!hero) return undefined;
    let hidden = false;
    const check = () => {
      if (hidden) return;
      const trigger = hero.offsetTop + hero.offsetHeight * 0.2;
      if (window.scrollY > trigger) {
        hidden = true;
        setHeroHidden(true);
        window.setTimeout(() => {
          trending?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  const openShare = (title: string, href: string) => {
    const url = new URL(href, window.location.origin).toString();
    setShare({ title, url });
  };

  const { slides, cards, featured, mini, large, small, sidebar } = landingSlots(items);

  return (
    <LandingShareContext.Provider value={openShare}>
      <div className="ytl-landing">
        <div className="main-content">
          {/* Reference nests hero → trending → latest → magazine inside
              .container (max-width 1200 + 15px padding = a centered 1170px
              column); tags/newsletter sit outside it at full bleed. */}
          <div className="container">
            {!heroHidden && <LandingHero />}
            <TrendingSlider items={slides} />
            <PopularPostsSlider items={cards} />
            <LandingMagazine
              featured={featured}
              mini={mini}
              large={large}
              small={small}
              sidebar={sidebar}
            />
            <ShareModal data={share} onClose={() => setShare(null)} />
          </div>
          <LandingTags tags={tags} />
          <LandingNewsletter />
        </div>
        <LandingFooter />
        <ScrollToTop />
      </div>
    </LandingShareContext.Provider>
  );
}
