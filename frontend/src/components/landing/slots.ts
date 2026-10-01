import type { LandingItem } from './types';

/**
 * The reference landing page splits its content pool into fixed-size slots:
 * 6 trending slides, 6 popular cards, 2 featured, 5 mini, 2 large, 2 small
 * and 2 sidebar items — 25 in total.
 *
 * The naive `items.slice(start, start + size)` port of that layout silently
 * returned short (or empty) arrays whenever the pool held fewer than 25
 * items, which meant whole sections such as the sidebar ADVERTISEMENTS
 * widget never rendered at all.
 *
 * `landingSlots` walks a single rotation cursor over the pool instead: every
 * slot fills to its full size, an item is never repeated inside the same
 * slot until the pool is exhausted, and repeats across slots only begin once
 * there is genuinely nothing left to show.
 */
export interface LandingSlots {
  slides: LandingItem[];
  cards: LandingItem[];
  featured: LandingItem[];
  mini: LandingItem[];
  large: LandingItem[];
  small: LandingItem[];
  sidebar: LandingItem[];
}

export const SLOT_SIZES = {
  slides: 6,
  cards: 6,
  featured: 2,
  mini: 5,
  large: 2,
  small: 2,
  sidebar: 2,
} as const;

const SLOT_ORDER = [
  'slides',
  'cards',
  'featured',
  'mini',
  'large',
  'small',
  'sidebar',
] as const;

export function landingSlots(items: LandingItem[]): LandingSlots {
  const out: Record<(typeof SLOT_ORDER)[number], LandingItem[]> = {
    slides: [],
    cards: [],
    featured: [],
    mini: [],
    large: [],
    small: [],
    sidebar: [],
  };

  if (items.length === 0) return out;

  let cursor = 0;

  for (const name of SLOT_ORDER) {
    const size = SLOT_SIZES[name];
    const picked: LandingItem[] = [];
    const seen = new Set<string>();
    // Consecutive misses — a full sweep with no pick means every item is
    // already used in this slot, so stop trying to stay unique.
    let stall = 0;

    while (picked.length < size && stall <= items.length) {
      const item = items[cursor % items.length];
      cursor += 1;
      if (seen.has(item.href)) {
        stall += 1;
        continue;
      }
      seen.add(item.href);
      picked.push(item);
      stall = 0;
    }

    // Pool smaller than the slot — repeat rather than render short.
    while (picked.length < size) {
      picked.push(items[cursor % items.length]);
      cursor += 1;
    }

    out[name] = picked;
  }

  return out;
}
