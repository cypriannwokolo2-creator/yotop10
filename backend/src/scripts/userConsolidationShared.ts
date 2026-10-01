import path from 'path';
import { Types } from 'mongoose';

/**
 * Shared contract between consolidateUsersToCyprianzube.ts (forward) and
 * rollbackConsolidateUsers.ts. Kept free of model imports so it stays cheap
 * to unit test and so both scripts agree on the exact backup layout.
 *
 * Backups are JSON, so BSON values (ObjectId, Date) are encoded as a two-key
 * Extended-JSON subset (`{$oid}` / `{$date}`). toStorage() throws on anything
 * it cannot represent rather than silently dropping a field — a corrupt
 * rollback file is worse than a failed migration.
 */

/** Identifier stamped into every backup this migration produces. */
export const MIGRATION_ID = 'consolidate-users-to-cyprianzube';

/** Account that receives every re-pointed piece of content. */
export const TARGET_USERNAME = 'cyprianzube';

/** Collections whose author_* fields are re-pointed at the target account. */
export const AUTHORED_COLLECTIONS = ['posts', 'articles', 'comments'] as const;

/** Per-user bookkeeping purged together with the deleted accounts. */
export const SECONDARY_USER_COLLECTIONS = [
  'fingerprintobservations',
  'usernamehistories',
  'trustscorelogs',
  'savedposts',
  'notifications',
  'userdevices',
] as const;

export type AuthoredCollection = (typeof AUTHORED_COLLECTIONS)[number];
export type SecondaryCollection = (typeof SECONDARY_USER_COLLECTIONS)[number];

/** A document captured for restore: `_id` must survive the JSON round-trip. */
export interface BackedUpDoc {
  _id: Types.ObjectId;
  [key: string]: unknown;
}

/** The author fields the forward pass overwrites, preserved for rollback. */
export interface AuthorSnapshot {
  _id: Types.ObjectId;
  author_id: string;
  author_username: string;
  author_display_name: string;
}

export interface ConsolidationBackup {
  migration: string;
  createdAt: string;
  target: { user_id: string; username: string };
  users: BackedUpDoc[];
  authored: Record<string, AuthorSnapshot[]>;
  secondary: Record<string, BackedUpDoc[]>;
  adminmessages: BackedUpDoc[];
}

/** JSON-safe projection of a BSON document. */
type Stored = null | string | number | boolean | Stored[] | { [key: string]: Stored };

interface ObjectIdLike {
  _bsontype?: unknown;
  toHexString(): string;
}

/** Encoded ObjectIds are exactly 24 hex characters. */
const OBJECT_ID_HEX = /^[0-9a-f]{24}$/i;

function isObjectIdLike(value: object): value is ObjectIdLike {
  const candidate = value as ObjectIdLike;
  const type = String(candidate._bsontype ?? '');
  return (type === 'ObjectId' || type === 'ObjectID') && typeof candidate.toHexString === 'function';
}

function typeName(value: unknown): string {
  if (value === null) return 'null';
  const ctor = (value as { constructor?: { name?: string } }).constructor;
  return ctor?.name ?? typeof value;
}

export function toStorage(value: unknown): Stored {
  if (value === null) return null;

  const kind = typeof value;
  if (kind === 'string' || kind === 'boolean') return value as string | boolean;
  if (kind === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new Error(`Cannot back up non-finite number: ${String(value)}`);
    }
    return value as number;
  }
  if (kind === 'undefined') {
    throw new Error('Cannot back up undefined — the document is missing a required value');
  }
  if (kind === 'bigint') {
    throw new Error(`Cannot back up bigint: ${String(value)}`);
  }

  if (value instanceof Date) return { $date: value.toISOString() };
  if (Array.isArray(value)) return value.map(toStorage);

  if (kind === 'object') {
    const obj = value as object;
    if (isObjectIdLike(obj)) return { $oid: obj.toHexString() };

    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) {
      throw new Error(`Cannot back up BSON value of type: ${typeName(value)}`);
    }

    const out: { [key: string]: Stored } = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = toStorage(entry);
    }
    return out;
  }

  throw new Error(`Cannot back up value of type: ${kind}`);
}

export function fromStorage(value: Stored): unknown {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.map(fromStorage);

  const keys = Object.keys(value);
  const only = keys.length === 1 ? keys[0] : undefined;
  const first = only === undefined ? null : value[only];
  // Only decode when the payload is actually well-formed — a document that
  // legitimately owns a `$oid`/`$date` key must survive as-is, not blow up.
  if (only === '$oid' && typeof first === 'string' && OBJECT_ID_HEX.test(first)) {
    return new Types.ObjectId(first);
  }
  if (only === '$date' && typeof first === 'string' && !Number.isNaN(Date.parse(first))) {
    return new Date(first);
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    out[key] = fromStorage(entry);
  }
  return out;
}

export function stringifyBackup(backup: ConsolidationBackup): string {
  return JSON.stringify(toStorage(backup), null, 2);
}

export function parseBackup(text: string): ConsolidationBackup {
  return fromStorage(JSON.parse(text) as Stored) as ConsolidationBackup;
}

/** Widens a driver result so it can be stored in a ConsolidationBackup. */
export function asBackedUpDocs(docs: readonly unknown[]): BackedUpDoc[] {
  return docs as BackedUpDoc[];
}

/**
 * Backups are written under `backend/uploads/` because that is the one
 * backend path bind-mounted into the dev container — the migration must run
 * there (MongoDB is not published to the host), but the rollback file has to
 * land on the host. Resolves identically from `src/scripts/` and `dist/scripts/`.
 */
export function backupDir(): string {
  return path.resolve(__dirname, '../../uploads/migrations-backups');
}
