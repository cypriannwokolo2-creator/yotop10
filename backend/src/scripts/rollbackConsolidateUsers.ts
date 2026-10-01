import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { resolveMongoUri } from '../lib/database/mongoConnector';
import {
  ConsolidationBackup,
  MIGRATION_ID,
  backupDir,
  parseBackup,
} from './userConsolidationShared';

dotenv.config();

/**
 * ROLLBACK for consolidateUsersToCyprianzube.ts — required by AGENTS.md §11
 * and written BEFORE the forward migration was executed.
 *
 * Reverses, in order:
 *   1. deletes the `cyprianzube` account the forward pass created
 *      (guarded: only if user_id AND username both match the backup)
 *   2. restores author_id / author_username / author_display_name on every
 *      reassigned post, article and comment
 *   3. re-inserts the purged per-user bookkeeping documents
 *   4. restores adminmessages.dismissed_by verbatim
 *   5. re-inserts the deleted fingerprint users
 *   6. writes its own audit-log entry
 *
 * Idempotent: re-running against an already-restored database is a no-op.
 *
 * Usage:  tsx src/scripts/rollbackConsolidateUsers.ts [path/to/backup.json]
 *         (defaults to the newest file in backend/uploads/migrations-backups/)
 */

function findLatestBackup(): string {
  const dir = backupDir();
  if (!fs.existsSync(dir)) {
    throw new Error(`No backup directory at ${dir} — nothing to roll back.`);
  }
  const files = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json') && name.startsWith(`${MIGRATION_ID}-`))
    .sort();
  const latest = files[files.length - 1];
  if (!latest) {
    throw new Error(`No ${MIGRATION_ID}-*.json backup found in ${dir}.`);
  }
  return path.join(dir, latest);
}

async function loadBackup(): Promise<{ backup: ConsolidationBackup; file: string }> {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : findLatestBackup();
  const backup = parseBackup(fs.readFileSync(file, 'utf8'));
  if (backup.migration !== MIGRATION_ID) {
    throw new Error(`Backup ${file} belongs to migration "${backup.migration}", not "${MIGRATION_ID}".`);
  }
  if (!backup.target?.user_id || !Array.isArray(backup.users)) {
    throw new Error(`Backup ${file} is malformed — refusing to roll back.`);
  }
  return { backup, file };
}

async function restoreAuthoredContent(
  db: mongoose.Connection,
  backup: ConsolidationBackup,
): Promise<number> {
  let restored = 0;
  for (const [collection, snapshots] of Object.entries(backup.authored)) {
    for (const snapshot of snapshots) {
      await db.collection(collection).updateOne(
        { _id: snapshot._id },
        {
          $set: {
            author_id: snapshot.author_id,
            author_username: snapshot.author_username,
            author_display_name: snapshot.author_display_name,
          },
        },
      );
      restored += 1;
    }
    console.log(`  ${collection}: restored ${snapshots.length} author record(s)`);
  }
  return restored;
}

async function reinsertSecondary(db: mongoose.Connection, backup: ConsolidationBackup): Promise<number> {
  let restored = 0;
  for (const [collection, docs] of Object.entries(backup.secondary)) {
    if (docs.length === 0) continue;

    const ids = docs.map((doc) => doc._id);
    const present = await db
      .collection(collection)
      .find({ _id: { $in: ids } }, { projection: { _id: 1 } })
      .toArray();
    const presentIds = new Set(present.map((doc) => String(doc._id)));
    const missing = docs.filter((doc) => !presentIds.has(String(doc._id)));

    if (missing.length > 0) {
      await db.collection(collection).insertMany(missing);
    }
    restored += missing.length;
    console.log(`  ${collection}: restored ${missing.length}/${docs.length}`);
  }
  return restored;
}

async function restoreAdminMessages(db: mongoose.Connection, backup: ConsolidationBackup): Promise<number> {
  let restored = 0;
  for (const doc of backup.adminmessages) {
    await db.collection('adminmessages').replaceOne({ _id: doc._id }, doc, { upsert: true });
    restored += 1;
  }
  if (restored > 0) {
    console.log(`  adminmessages: restored ${restored}`);
  }
  return restored;
}

async function reinsertUsers(db: mongoose.Connection, backup: ConsolidationBackup): Promise<number> {
  const ids = backup.users.map((doc) => doc._id);
  const present = await db
    .collection('users')
    .find({ _id: { $in: ids } }, { projection: { _id: 1 } })
    .toArray();
  const presentIds = new Set(present.map((doc) => String(doc._id)));
  const missing = backup.users.filter((doc) => !presentIds.has(String(doc._id)));

  if (missing.length > 0) {
    await db.collection('users').insertMany(missing);
  }
  console.log(`  users: restored ${missing.length}/${backup.users.length}`);
  return missing.length;
}

async function rollback(): Promise<void> {
  const { backup, file } = await loadBackup();
  console.log(`Rolling back ${MIGRATION_ID}`);
  console.log(`  backup: ${file}`);
  console.log(`  created: ${backup.createdAt}`);

  await mongoose.connect(await resolveMongoUri());
  console.log('Connected to MongoDB');

  const db = mongoose.connection;

  // 1. Remove the account the forward pass created. Both keys must match so a
  //    real user who happens to pick the name "cyprianzube" is never dropped.
  const removedTarget = await db.collection('users').deleteMany({
    user_id: backup.target.user_id,
    username: backup.target.username,
  });
  console.log(`  target account "${backup.target.username}": removed ${removedTarget.deletedCount}`);

  // 2-5. Restore everything else.
  const authored = await restoreAuthoredContent(db, backup);
  const secondary = await reinsertSecondary(db, backup);
  const adminmessages = await restoreAdminMessages(db, backup);
  const users = await reinsertUsers(db, backup);

  await AuditLog.create({
    admin_id: null,
    action: 'rollback_consolidate_users',
    ip: '127.0.0.1',
    user_agent: 'rollbackConsolidateUsers.ts',
    metadata: {
      migration: MIGRATION_ID,
      backup_file: file,
      restored_users: users,
      restored_authored: authored,
      restored_secondary: secondary,
      restored_adminmessages: adminmessages,
    },
  });

  console.log('\nRollback complete:');
  console.log(`  users restored:            ${users}`);
  console.log(`  author records restored:   ${authored}`);
  console.log(`  secondary records restored: ${secondary}`);
  console.log(`  admin messages restored:   ${adminmessages}`);

  await mongoose.disconnect();
}

rollback().catch((error) => {
  console.error(error);
  process.exit(1);
});
