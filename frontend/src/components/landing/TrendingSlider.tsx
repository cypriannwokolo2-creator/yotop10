'use client';

import { useEffect, useRef, useState, type TouchEvent } from 'react';
import type { LandingItem } from './types';

const SLIDE_BG_FALLBACK =
  'linear-gradient(135deg, rgba(219, 37, 37, 0.35), rgba(255, 142, 83, 0.35))';

export function TrendingSlider({ items }: { items: LandingItem[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const count = items.length;

  // Port of script.js:359-467 — autoplay every 3s, paused while hovering or
  // touching, wrap-around navigation, swipe with a 50px threshold.
  useEffect(() => {
    if (count < 2 || paused) return;
    const interval = window.setInterval(() => {
      setCurrent(c => (c + 1) % count);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [count, paused]);

  if (count === 0) return null;

  const next = () => {
    setCurrent(c => (c + 1) % count);
    setPaused(false);
  };
  const prev = () => {
    setCurrent(c => (c - 1 + count) % count);
    setPaused(false);
  };
  const goTo = (index: number) => {
    setCurrent(index);
    setPaused(false);
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0].screenX;
    setPaused(true);
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const end = e.changedTouches[0].screenX;
    if (end < touchStartX.current - 50) {
      next();
    } else if (end > touchStartX.current + 50) {
      prev();
    }
    setPaused(false);
  };

  return (
    <section className="trending-section" id="trending">
      <div className="section-header">
        <h2 className="section-title">TRENDING NOW</h2>
      </div>

      <div
        className="trending-slider"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="slider-controls">
          <button
            className="slider-nav-btn prev-btn"
            type="button"
            aria-label="Previous slide"
            onClick={prev}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M15.41 16.58L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.42z"
              />
            </svg>
          </button>
          <button
            className="slider-nav-btn next-btn"
            type="button"
            aria-label="Next slide"
            onClick={next}
          >
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.42z"
              />
            </svg>
          </button>
        </div>

        {items.map((item, index) => {
          const state =
            index === current ? 'active' : index < current ? 'prev' : 'next';
          return (
            <a
              key={`${item.href}-${index}`}
              href={item.href}
              className={`slide ${state}`}
            >
              <div
                className="slide-bg"
                style={{
                  backgroundImage: item.image
                    ? `url('${item.image}')`
                    : SLIDE_BG_FALLBACK,
                }}
              />
              <div className="slide-content">
                <h3 className="slide-title">{item.title}</h3>
                <div className="slide-meta">
                  <span>By {item.author}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="slider-pagination">
        {items.map((_, index) => (
          <div
            key={index}
            className={`pagination-dot${index === current ? ' active' : ''}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </section>
  );
}
