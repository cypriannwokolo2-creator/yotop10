import { User } from '../../models/User';

/**
 * M41.1 user-auth migration (docs/plans-auth-m41.md §3).
 * Idempotent — runs once at boot, before the server listens.
 *
 * - Drops the legacy UNIQUE index on device_fingerprint (M11/M15
 *   era). Email/password auth users carry no fingerprint, and a
 *   plain unique index would cap fingerprint-less users at one.
 * - Re-creates device_fingerprint_1 as a sparse, non-unique index
 *   so the still-active fingerprint middleware keeps its lookup
 *   performance until M41.2 removes the field entirely.
 * - Ensures the sparse UNIQUE index on email (also declared on the
 *   schema; enforced here so it exists even if autoIndex is off).
 * - Flags pre-M41 accounts (no email) as legacy_anonymous — the
 *   marker the M41.4 anonymous-post cleanup cron will consume.
 */
export async function runUserAuthMigration(): Promise<void> {
  const collection = User.collection;

  try {
    await collection.dropIndex('device_fingerprint_1');
    console.log('[migration:userAuth] dropped legacy unique index device_fingerprint_1');
  } catch {
    // Index already absent (fresh install or repeat run) — expected.
  }

  await collection.createIndex(
    { device_fingerprint: 1 },
    { sparse: true, name: 'device_fingerprint_1' },
  );
  await collection.createIndex(
    { email: 1 },
    { unique: true, sparse: true, name: 'email_1' },
  );

  const result = await collection.updateMany(
    { email: { $exists: false } },
    { $set: { legacy_anonymous: true } },
  );
  if (result.modifiedCount > 0) {
    console.log(`[migration:userAuth] flagged ${result.modifiedCount} legacy anonymous user(s)`);
  }
  console.log('[migration:userAuth] complete');
}
