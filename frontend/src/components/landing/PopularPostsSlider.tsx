'use client';

import { useEffect, useRef, useState } from 'react';
import type { LandingItem } from './types';

const TRANSITION = 'transform 0.6s cubic-bezier(0.68,-0.55,0.27,1.55)';
const CARD_BG_FALLBACK =
  'linear-gradient(135deg, rgba(219, 37, 37, 0.35), rgba(255, 142, 83, 0.35))';

function cardsToShowForWidth(width: number): number {
  if (width <= 600) return 1;
  if (width <= 1024) return 2;
  return 3;
}

// Port of the inline card-slider script (index.html:186-261): clones the first
// and last N cards for an infinite loop, snaps back without animation after a
// full cycle, auto-advances every 4s.
export function PopularPostsSlider({ items }: { items: LandingItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);
  const nRef = useRef(3);
  const timerRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const cardWRef = useRef(0);
  const [visibleN, setVisibleN] = useState(3);
  const [view, setView] = useState({ idx: 0, animate: false });

  const total = items.length;

  const apply = (idx: number, animate: boolean) => {
    idxRef.current = idx;
    setView({ idx, animate });
  };

  const measure = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.querySelector('.article-card');
    if (!(first instanceof HTMLElement)) return;
    const gapRaw = window.getComputedStyle(track).gap;
    const gap = parseInt(gapRaw, 10);
    cardWRef.current = first.offsetWidth + (Number.isNaN(gap) ? 24 : gap);
  };

  const moveSlider = (idx: number, animate: boolean) => {
    apply(idx, animate);
  };

  const nextSlide = () => {
    const nextIdx = idxRef.current + 1;
    moveSlider(nextIdx, true);
    if (nextIdx === total + nRef.current) {
      timeoutRef.current = window.setTimeout(() => {
        moveSlider(nRef.current, false);
      }, 600);
    }
  };

  const prevSlide = () => {
    const nextIdx = idxRef.current - 1;
    moveSlider(nextIdx, true);
    if (nextIdx === 0) {
      timeoutRef.current = window.setTimeout(() => {
        moveSlider(total, false);
      }, 600);
    }
  };

  const resetTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(nextSlide, 4000);
  };

  useEffect(() => {
    if (total === 0) return undefined;
    const initial = Math.min(cardsToShowForWidth(window.innerWidth), total);
    nRef.current = initial;
    setVisibleN(initial);
    measure();
    apply(initial, false);
    resetTimer();

    const onResize = () => {
      const updated = Math.min(cardsToShowForWidth(window.innerWidth), total);
      if (updated !== nRef.current) {
        const delta = updated - nRef.current;
        nRef.current = updated;
        setVisibleN(updated);
        apply(idxRef.current + delta, false);
      }
      measure();
      apply(idxRef.current, false);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  if (total === 0) return null;

  const children: Array<{ item: LandingItem; key: string }> = [];
  for (let i = visibleN; i > 0; i--) {
    const item = items[total - i];
    children.push({ item, key: `pre-${item.href}-${total - i}` });
  }
  items.forEach((item, i) => children.push({ item, key: `orig-${item.href}-${i}` }));
  for (let i = 0; i < visibleN; i++) {
    const item = items[i];
    children.push({ item, key: `post-${item.href}-${i}` });
  }

  const cardWidth = cardWRef.current;

  return (
    <section className="latest-articles-section">
      <div className="section-header">
        <h2 className="section-title">POPULAR POSTS</h2>
      </div>
      <div className="card-slider">
        <button
          className="slider-arrow left"
          type="button"
          aria-label="Previous"
          onClick={() => {
            prevSlide();
            resetTimer();
          }}
        >
          &#10094;
        </button>
        <div
          className="card-slider-track"
          ref={trackRef}
          style={{
            transform: `translateX(-${view.idx * cardWidth}px)`,
            transition: view.animate ? TRANSITION : 'none',
          }}
        >
          {children.map(({ item, key }) => (
            <a key={key} href={item.href} className="article-card-link">
              <div className="article-card">
                <div
                  className="card-bg"
                  style={{
                    backgroundImage: item.image
                      ? `url('${item.image}')`
                      : CARD_BG_FALLBACK,
                  }}
                />
                <div className="card-gradient" />
                <div className="post-overlay">
                  <span className="post-category">
                    {item.category.toUpperCase()}
                  </span>
                </div>
                <div className="card-title">{item.title}</div>
                <div className="card-meta">
                  <span className="author-name">{item.author}</span>
                  <span className="reading-time">{item.readingMeta}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <button
          className="slider-arrow right"
          type="button"
          aria-label="Next"
          onClick={() => {
            nextSlide();
            resetTimer();
          }}
        >
          &#10095;
        </button>
      </div>
    </section>
  );
}
