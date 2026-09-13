export function toShortUsername(full: string): string {
  if (!full) return full;
  // Only truncate default a_xxxx_xxxx (e.g. a_e3ga_9f2a -> a_e3ga), keep custom a_cutie as is
  const defaultMatch = full.match(/^a_([a-z0-9]{4})_[a-z0-9]{4,}$/i);
  if (defaultMatch) return `a_${defaultMatch[1].toLowerCase()}`;
  // For a_ prefixed custom names, keep full lowercase (e.g. a_cutie stays a_cutie)
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

export function isShortSlug(slug: string): boolean {
  const clean = slug.replace(/^a_/, '');
  return clean.length >= 4 && clean.length <= 8;
}
