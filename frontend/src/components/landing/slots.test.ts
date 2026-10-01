import { describe, it, expect } from 'vitest';
import { landingSlots, SLOT_SIZES } from './slots';
import type { LandingItem } from './types';

const makeItem = (i: number): LandingItem => ({
  href: `/item-${i}`,
  title: `Item ${i}`,
  image: null,
  category: 'Cat',
  author: 'A',
  date: 'Jan 1, 2026',
  excerpt: '',
  readingMeta: '1 min read',
});

const total = Object.values(SLOT_SIZES).reduce((a, b) => a + b, 0);

describe('landingSlots', () => {
  it('totals 25 slots — the reference layout size', () => {
    expect(total).toBe(25);
  });

  it('fills every slot when the pool is large enough', () => {
    const items = Array.from({ length: 30 }, (_, i) => makeItem(i));
    const s = landingSlots(items);
    expect(s.slides).toHaveLength(6);
    expect(s.cards).toHaveLength(6);
    expect(s.featured).toHaveLength(2);
    expect(s.mini).toHaveLength(5);
    expect(s.large).toHaveLength(2);
    expect(s.small).toHaveLength(2);
    expect(s.sidebar).toHaveLength(2);
  });

  it('fills every slot when the pool is smaller than 25', () => {
    const items = Array.from({ length: 22 }, (_, i) => makeItem(i));
    const s = landingSlots(items);
    expect(s.slides).toHaveLength(6);
    expect(s.cards).toHaveLength(6);
    expect(s.featured).toHaveLength(2);
    expect(s.mini).toHaveLength(5);
    expect(s.large).toHaveLength(2);
    expect(s.small).toHaveLength(2);
    // This one used to render nothing at all.
    expect(s.sidebar).toHaveLength(2);
  });

  it('never repeats an item inside a single slot', () => {
    const items = Array.from({ length: 22 }, (_, i) => makeItem(i));
    const s = landingSlots(items);
    const lists: LandingItem[][] = [
      s.slides,
      s.cards,
      s.featured,
      s.mini,
      s.large,
      s.small,
      s.sidebar,
    ];
    for (const list of lists) {
      const hrefs = list.map(i => i.href);
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('exhausts the pool before repeating across slots', () => {
    const items = Array.from({ length: 22 }, (_, i) => makeItem(i));
    const s = landingSlots(items);
    const first22 = [
      ...s.slides,
      ...s.cards,
      ...s.featured,
      ...s.mini,
      ...s.large,
      ...s.small,
      ...s.sidebar,
    ].slice(0, 22);
    expect(new Set(first22.map(i => i.href)).size).toBe(22);
  });

  it('never loops forever on a pool smaller than the largest slot', () => {
    const items = [makeItem(0), makeItem(1), makeItem(2)];
    const s = landingSlots(items);
    expect(s.mini).toHaveLength(5);
    expect(s.slides).toHaveLength(6);
    expect(s.sidebar).toHaveLength(2);
  });

  it('returns empty slots for an empty pool', () => {
    const s = landingSlots([]);
    expect(s.slides).toEqual([]);
    expect(s.sidebar).toEqual([]);
  });
});
