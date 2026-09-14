/**
 * Accepts the image URLs this app actually produces: site-relative upload
 * paths (/uploads/...) plus full http(s) URLs. express-validator's isURL()
 * rejects relative paths, which broke every uploaded cover/item image
 * with a misleading 400 at submit time.
 */
export function isAcceptedImageUrl(value: unknown): boolean {
  // Absent (optional fields) is always fine — express-validator also skips
  // undefined/null before custom validators run.
  if (value === '' || value === undefined || value === null) return true;
  if (typeof value !== 'string') return false;
  if (/^\/uploads\/[A-Za-z0-9_.-]+$/.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}
