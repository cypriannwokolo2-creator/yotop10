import { getConfig } from './systemConfig';

export type ListOrder = 'asc' | 'desc';

export const RANKED_LIST_TYPES: ReadonlySet<string> = new Set([
  'top_list',
  'best_of',
  'worst_of',
  'hidden_gems',
  'counter_list',
]);

export function isRankedListType(postType: unknown): boolean {
  return typeof postType === 'string' && RANKED_LIST_TYPES.has(postType);
}

export function getListOrder(): ListOrder {
  try {
    return getConfig().list_order === 'desc' ? 'desc' : 'asc';
  } catch {
    return 'asc';
  }
}

export function getItemSortDirection(): 1 | -1 {
  return getListOrder() === 'desc' ? -1 : 1;
}

export function orderItemsForDisplay<T extends { rank?: unknown }>(postType: unknown, items: T[]): T[] {
  if (!isRankedListType(postType) || getListOrder() === 'asc') return items;
  return [...items].sort((a, b) => Number(b.rank ?? 0) - Number(a.rank ?? 0));
}
