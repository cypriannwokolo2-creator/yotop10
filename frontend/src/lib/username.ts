export function toShortUsername(full: string): string {
  if (!full) return full;
  const m = full.match(/^a_([a-z0-9]{4})_?[a-z0-9]*$/i);
  if (m) return `a_${m[1].toLowerCase()}`;
  if (full.startsWith('a_') && full.length > 6) {
    return `a_${full.slice(2, 6).toLowerCase()}`;
  }
  return full;
}

export function toPublicUsername(full: string): string {
  return toShortUsername(full);
}

export function toPublicSlug(full: string): string {
  const pub = toPublicUsername(full);
  return pub.replace(/^a_/, '');
}

export function isShortSlug(slug: string): boolean {
  const clean = slug.replace(/^a_/, '');
  return clean.length === 4;
}
