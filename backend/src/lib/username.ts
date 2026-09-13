/**
 * Public username helpers — short display `a_e3ga` vs full internal `a_e3ga_9f2a`
 * Full stays in DB (username, custom_display_name), short is for display/URL.
 */

export function toShortUsername(full: string): string {
  if (!full) return full;
  // Only truncate default a_xxxx_xxxx (e.g. a_e3ga_9f2a -> a_e3ga), keep custom a_cutie as is
  const defaultMatch = full.match(/^a_([a-z0-9]{4})_[a-z0-9]{4,}$/i);
  if (defaultMatch) return `a_${defaultMatch[1].toLowerCase()}`;
  // For other a_ names (custom), keep full lowercase
  if (full.startsWith('a_')) return full.toLowerCase();
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
  return clean.length >= 4 && clean.length <= 8;
}
