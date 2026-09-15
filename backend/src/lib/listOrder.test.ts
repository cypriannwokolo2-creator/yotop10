import { describe, it, expect } from 'vitest';
import { RANKED_LIST_TYPES, isRankedListType, orderItemsForDisplay } from './listOrder';

describe('listOrder', () => {
  it('gates exactly the ranked list types', () => {
    expect(isRankedListType('top_list')).toBe(true);
    expect(isRankedListType('best_of')).toBe(true);
    expect(isRankedListType('worst_of')).toBe(true);
    expect(isRankedListType('hidden_gems')).toBe(true);
    expect(isRankedListType('counter_list')).toBe(true);
    expect(isRankedListType('this_vs_that')).toBe(false);
    expect(isRankedListType('who_is_better')).toBe(false);
    expect(isRankedListType('fact_drop')).toBe(false);
    expect(isRankedListType(undefined)).toBe(false);
    expect(isRankedListType('')).toBe(false);
    expect(RANKED_LIST_TYPES.size).toBe(5);
  });

  it('returns items untouched for non-ranked types regardless of setting', () => {
    const items = [{ rank: 1 }, { rank: 2 }];
    expect(orderItemsForDisplay('this_vs_that', items)).toBe(items);
    expect(orderItemsForDisplay('fact_drop', items)).toBe(items);
  });

  it('returns items untouched when order is asc (default)', () => {
    const items = [{ rank: 1 }, { rank: 2 }, { rank: 3 }];
    expect(orderItemsForDisplay('top_list', items)).toBe(items);
  });
});
