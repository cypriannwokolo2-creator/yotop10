import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { resolveMongoUri } from '../lib/database/mongoConnector';
import {
  AUTHORED_COLLECTIONS,
  ConsolidationBackup,
  MIGRATION_ID,
  SECONDARY_USER_COLLECTIONS,
  TARGET_USERNAME,
  AuthorSnapshot,
  asBackedUpDocs,
  backupDir,
  stringifyBackup,
} from './userConsolidationShared';

dotenv.config();

/**
 * Forward migration for M-final consolidation:
 *
 *   1. every auto-minted fingerprint account is captured to a JSON backup
 *   2. a `cyprianzube` account is created (or reused) to own all content
 *   3. posts / articles / comments are re-pointed at it, denormalised
 *      author_username + author_display_name included
 *   4. per-user bookkeeping is purged, admin message dismissals untangled
 *   5. the fingerprint accounts are deleted
 *   6. an audit-log entry records the run and the backup path
 *
 * The backup is written BEFORE the first destructive write, as required by
 * AGENTS.md §11. Idempotent: a completed run reports "nothing to do".
 *
 * Usage:  cd backend && ./node_modules/.bin/tsx src/scripts/consolidateUsersToCyprianzube.ts
 *         (must run where MONGODB_URI is reachable — i.e. inside yotop10_dev)
 * Undo:   ./node_modules/.bin/tsx src/scripts/rollbackConsolidateUsers.ts
 */

const AUTHOR_FIELDS = ['author_id', 'author_username', 'author_display_name'] as const;

function preservedText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

async function captureAuthoredSnapshots(
  db: mongoose.Connection,
  ids: string[],
): Promise<Record<string, AuthorSnapshot[]>> {
  const snapshots: Record<string, AuthorSnapshot[]> = {};

  for (const collection of AUTHORED_COLLECTIONS) {
    const docs = await db.collection(collection).find({ author_id: { $in: ids } }).toArray();
    snapshots[collection] = docs.map((doc) => ({
      _id: new Types.ObjectId(String(doc._id)),
      author_id: preservedText(doc.author_id, ''),
      author_username: preservedText(doc.author_username, TARGET_USERNAME),
      author_display_name: preservedText(doc.author_display_name, TARGET_USERNAME),
    }));
  }

  return snapshots;
}

async function resolveTargetUser(): Promise<{ user_id: string; username: string }> {
  const existing = await User.findOne({ username: TARGET_USERNAME })
    .select('user_id username')
    .lean();

  if (existing) {
    return { user_id: existing.user_id, username: existing.username };
  }

  const created = await User.create({
    user_id: crypto.randomBytes(8).toString('hex'),
    username: TARGET_USERNAME,
    default_username: TARGET_USERNAME,
    short_username: TARGET_USERNAME,
    default_short: TARGET_USERNAME,
    device_fingerprint: crypto.randomBytes(16).toString('hex'),
    trust_score: 1.0,
    is_admin: false,
  });

  return { user_id: created.user_id, username: created.username };
}

async function consolidate(): Promise<void> {
  await mongoose.connect(await resolveMongoUri());
  console.log('Connected to MongoDB');

  const db = mongoose.connection;
  const users = db.collection('users');

  const fingerprintUsers = asBackedUpDocs(
    await users.find({ device_fingerprint: { $exists: true, $ne: null } }).toArray(),
  );
  if (fingerprintUsers.length === 0) {
    console.log('No fingerprint users found — nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const target = await resolveTargetUser();

  // Exclude the target itself: it also carries a device_fingerprint, and a
  // re-run must never delete the account it just consolidated into.
  const deleted = fingerprintUsers.filter(
    (doc) => String(doc.user_id) !== target.user_id && String(doc.username) !== target.username,
  );
  const ids = deleted.map((doc) => String(doc.user_id));

  if (ids.length === 0) {
    console.log(`Nothing to consolidate — every fingerprint account already belongs to ${target.username}.`);
    await mongoose.disconnect();
    return;
  }

  const authored = await captureAuthoredSnapshots(db, ids);

  const secondary: ConsolidationBackup['secondary'] = {};
  for (const collection of SECONDARY_USER_COLLECTIONS) {
    secondary[collection] = asBackedUpDocs(
      await db.collection(collection).find({ user_id: { $in: ids } }).toArray(),
    );
  }

  const adminmessages = asBackedUpDocs(
    await db.collection('adminmessages').find({ dismissed_by: { $in: ids } }).toArray(),
  );

  const backup: ConsolidationBackup = {
    migration: MIGRATION_ID,
    createdAt: new Date().toISOString(),
    target,
    users: deleted,
    authored,
    secondary,
    adminmessages,
  };

  // Backup first: nothing destructive happens until this file exists on disk.
  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  const backupFile = path.join(dir, `${MIGRATION_ID}-${Date.now()}.json`);
  fs.writeFileSync(backupFile, stringifyBackup(backup), 'utf8');

  console.log('\nPlan:');
  console.log(`  target account:  ${target.username} (${target.user_id})`);
  console.log(`  users to delete: ${ids.length}`);
  for (const collection of AUTHORED_COLLECTIONS) {
    console.log(`  ${collection.padEnd(12)} to re-point: ${authored[collection].length}`);
  }
  for (const collection of SECONDARY_USER_COLLECTIONS) {
    if (secondary[collection].length > 0) {
      console.log(`  ${collection.padEnd(12)} to purge:   ${secondary[collection].length}`);
    }
  }
  console.log(`  adminmessages to tidy: ${adminmessages.length}`);
  console.log(`  backup: ${backupFile}\n`);

  const reassigned: Record<string, number> = {};
  for (const collection of AUTHORED_COLLECTIONS) {
    const result = await db.collection(collection).updateMany(
      { author_id: { $in: ids } },
      {
        $set: {
          author_id: target.user_id,
          author_username: target.username,
          author_display_name: target.username,
        },
      },
    );
    reassigned[collection] = result.modifiedCount;
  }

  const purged: Record<string, number> = {};
  for (const collection of SECONDARY_USER_COLLECTIONS) {
    const result = await db.collection(collection).deleteMany({ user_id: { $in: ids } });
    purged[collection] = result.deletedCount;
  }

  const tidied = await db
    .collection<{ dismissed_by: string[] }>('adminmessages')
    .updateMany({ dismissed_by: { $in: ids } }, { $pull: { dismissed_by: { $in: ids } } });

  const removedUsers = await users.deleteMany({
    user_id: { $in: ids },
    username: { $ne: target.username },
  });

  await AuditLog.create({
    admin_id: null,
    action: 'migrate_consolidate_users',
    ip: '127.0.0.1',
    user_agent: 'consolidateUsersToCyprianzube.ts',
    metadata: {
      migration: MIGRATION_ID,
      backup_file: backupFile,
      target_user_id: target.user_id,
      deleted_users: removedUsers.deletedCount,
      reassigned,
      purged,
      tidied_adminmessages: tidied.modifiedCount,
      fields: AUTHOR_FIELDS,
    },
  });

  console.log('Migration complete:');
  console.log(`  users deleted:            ${removedUsers.deletedCount}`);
  for (const collection of AUTHORED_COLLECTIONS) {
    console.log(`  ${collection.padEnd(26)} re-pointed: ${reassigned[collection]}`);
  }
  console.log(`  admin messages tidied:    ${tidied.modifiedCount}`);
  console.log(`  backup (rollback input):  ${backupFile}`);

  await mongoose.disconnect();
}

consolidate().catch((error) => {
  console.error(error);
  process.exit(1);
});
