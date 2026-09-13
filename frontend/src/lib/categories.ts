export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  post_count: number;
  children: CategoryNode[];
}

export interface FlatCategory {
  slug: string;
  name: string;
  icon?: string;
  post_count: number;
  path: string[]; // ancestors + leaf name
  pathSlugs: string[];
  isLeaf: boolean;
  parentId: string | null;
  parentSlug: string | null;
}

export function flattenCategories(categories: CategoryNode[]): FlatCategory[] {
  const out: FlatCategory[] = [];
  for (const p of categories) {
    const parentPath = [p.name];
    const parentSlugs = [p.slug];
    // parent itself is not selectable if it has children (leaf-only policy)
    // but we still include it for path building
    for (const c of p.children || []) {
      out.push({
        slug: c.slug,
        name: c.name,
        icon: c.icon || p.icon,
        post_count: c.post_count,
        path: [...parentPath, c.name],
        pathSlugs: [...parentSlugs, c.slug],
        isLeaf: true,
        parentId: p.id,
        parentSlug: p.slug,
      });
    }
    // also allow parent as leaf if it has no children (edge)
    if (!p.children || p.children.length === 0) {
      out.push({
        slug: p.slug,
        name: p.name,
        icon: p.icon,
        post_count: p.post_count,
        path: parentPath,
        pathSlugs: parentSlugs,
        isLeaf: true,
        parentId: null,
        parentSlug: null,
      });
    }
  }
  return out;
}

export function getCategoryPath(slug: string, categories: CategoryNode[]): string[] | null {
  const flat = flattenCategories(categories);
  const found = flat.find(f => f.slug === slug);
  return found ? found.path : null;
}

export function getCategoryDisplayName(slug: string, categories: CategoryNode[]): string | null {
  const flat = flattenCategories(categories);
  const found = flat.find(f => f.slug === slug);
  return found ? found.name : null;
}

const RECENT_KEY = 'yotop10_recent_categories';

export function getRecentSlugs(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x: unknown) => typeof x === 'string').slice(0, 8) : [];
  } catch { return []; }
}

export function pushRecentSlug(slug: string) {
  try {
    const recents = getRecentSlugs().filter(s => s !== slug);
    recents.unshift(slug);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recents.slice(0, 8)));
  } catch {}
}

export function searchFlatCategories(query: string, flat: FlatCategory[], limit = 100): FlatCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = flat
    .map(item => {
      const name = item.name.toLowerCase();
      const pathStr = item.path.join(' ').toLowerCase();
      const slugStr = item.slug.toLowerCase();
      let score = -1;
      if (name === q) score = 100;
      else if (name.startsWith(q)) score = 90;
      else if (slugStr.includes(q)) score = 80;
      else if (name.includes(q)) score = 70;
      else if (pathStr.includes(q)) score = 60;
      // also check slug parts
      if (score === -1 && slugStr.split('/').some(p => p.includes(q))) score = 50;
      return { item, score };
    })
    .filter(x => x.score >= 0)
    .sort((a, b) => b.score - a.score || b.item.post_count - a.item.post_count || a.item.name.localeCompare(b.item.name))
    .slice(0, limit)
    .map(x => x.item);
  return scored;
}
