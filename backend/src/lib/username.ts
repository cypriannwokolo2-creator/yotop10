/**
 * Public username helpers — robust separate model
 * - default: a_xxxx_xxxx (e.g. a_e3ga_9f2a) -> short a_e3ga (4-char cap ONLY for default)
 * - custom: a_cutie / a_bigboss (3-32 flexible, no truncation)
 * - account id (user_id) never changes
 */

export function isDefaultFormat(full: string): boolean {
  return /^a_[a-z0-9]{4}_[a-z0-9]{4}$/i.test(full);
}

export function toDefaultShort(full: string): string {
  const m = full.match(/^a_([a-z0-9]{4})_[a-z0-9]{4}$/i);
  return m ? `a_${m[1].toLowerCase()}` : full.toLowerCase();
}

export function toCustomShort(full: string): string {
  return full.toLowerCase(); // flexible, keep full a_cutie
}

export function toShortUsername(full: string): string {
  if (!full) return full;
  if (isDefaultFormat(full)) return toDefaultShort(full);
  if (full.startsWith('a_')) return toCustomShort(full);
  return full;
}

export function getDisplayHandle(post: { author_display_name?: string; author_username: string }): string {
  const display = post.author_display_name || post.author_username;
  return display.replace(/^a_/, '');
}

export function getShortForUser(user: { default_username?: string; custom_display_name?: string | null; username: string; short_username?: string }): string {
  if (user.custom_display_name) return toCustomShort(user.custom_display_name);
  if (user.default_username) return toDefaultShort(user.default_username);
  return toShortUsername(user.username);
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
