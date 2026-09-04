/**
 * Public username helpers — short display `a_e3ga` vs full internal `a_e3ga_9f2a`
 * Full stays in DB (username, custom_display_name), short is for display/URL.
 */

export function toShortUsername(full: string): string {
  if (!full) return full;
  const m = full.match(/^a_([a-z0-9]{4})_?[a-z0-9]*$/i);
  if (m) return `a_${m[1].toLowerCase()}`;
  // Non-a_ scholar names: truncate to first 4 + prefix if not already short
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

export function extractShortFromFull(full: string): string {
  return toShortUsername(full);
}

export function isShortSlug(slug: string): boolean {
  const clean = slug.replace(/^a_/, '');
  return clean.length === 4;
}
