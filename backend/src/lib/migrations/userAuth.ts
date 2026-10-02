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
 * - Ensures sparse UNIQUE indexes on custom_display_name and
 *   short_username (ROM 2.8). Rename availability is checked with
 *   findOne before findOneAndUpdate, so two concurrent renames can
 *   both pass the check; the unique index is the atomic backstop
 *   that rejects the loser (the route maps that error to 409).
 *   Each field is pre-scanned for duplicates — if any exist, the
 *   index is skipped with a warning rather than failing boot.
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

  // ROM 2.8: unique handle slots. Dropped first so the index
  // definition is refreshed even if an older non-unique version
  // exists (same pattern as device_fingerprint_1 above).
  for (const field of ['custom_display_name', 'short_username'] as const) {
    try {
      await collection.dropIndex(`${field}_1`);
    } catch {
      // Index absent (fresh install or repeat run) — expected.
    }
    const withField = await collection.countDocuments({ [field]: { $exists: true } });
    const distinct = (await collection.distinct(field)).length;
    if (withField > distinct) {
      console.warn(
        `[migration:userAuth] ${withField - distinct} duplicate ${field} value(s) found; ` +
        `skipping unique index on ${field} until they are resolved`,
      );
      continue;
    }
    await collection.createIndex(
      { [field]: 1 },
      { unique: true, sparse: true, name: `${field}_1` },
    );
    console.log(`[migration:userAuth] unique index ensured: ${field}_1`);
  }

  const result = await collection.updateMany(
    { email: { $exists: false } },
    { $set: { legacy_anonymous: true } },
  );
  if (result.modifiedCount > 0) {
    console.log(`[migration:userAuth] flagged ${result.modifiedCount} legacy anonymous user(s)`);
  }
  console.log('[migration:userAuth] complete');
}
