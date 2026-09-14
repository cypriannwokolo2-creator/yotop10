/**
 * Identity maturity: brand-new accounts get nothing worth stealing.
 * Renames and seed-key generation unlock 7 days after joining, or as soon as
 * the account is trusted (score >= 1.0). This makes handle-squatting and
 * seed-grabbing structurally impossible for farmed accounts.
 */
const MATURITY_AGE_MS = 7 * 24 * 3600 * 1000;

export function isIdentityMature(createdAt: unknown, trustScore: unknown): boolean {
  const ageMs =
    createdAt instanceof Date
      ? Date.now() - createdAt.getTime()
      : Date.now() - new Date(String(createdAt ?? '')).getTime();
  if (Number.isNaN(ageMs)) return false;
  if (ageMs >= MATURITY_AGE_MS) return true;
  return typeof trustScore === 'number' && trustScore >= 1.0;
}
