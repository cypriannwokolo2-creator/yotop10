/**
 * Proof-of-effort challenge for identity creation.
 *
 * A math question costs a script nothing (it just adds), so minting is gated
 * on real compute instead: GET /api/users/challenge issues {challenge_id,
 * difficulty}, and POST /api/users/init must present a nonce such that
 * SHA-256("<challenge_id>:<nonce>") has `difficulty` leading zero bits.
 * At 20 bits a phone solves it silently in ~1-3s once per device; a script
 * farming thousands of accounts pays CPU for every single one. Challenges are
 * single-use and expire after 10 minutes.
 */
import crypto from 'crypto';
import { redis } from './redis';

const PREFIX = 'pow_challenge:';
export const POW_TTL_SECONDS = 600;
export const POW_DIFFICULTY_BITS = 20;

export interface PowChallenge {
  challenge_id: string;
  difficulty: number;
}

export async function issuePowChallenge(bits: number = POW_DIFFICULTY_BITS): Promise<PowChallenge> {
  const safeBits = Number.isInteger(bits) && bits >= 1 && bits <= 32 ? bits : POW_DIFFICULTY_BITS;
  const challenge_id = crypto.randomBytes(16).toString('hex');
  await redis.set(`${PREFIX}${challenge_id}`, JSON.stringify({ bits: safeBits }), { EX: POW_TTL_SECONDS });
  return { challenge_id, difficulty: safeBits };
}

export function meetsDifficulty(digestHex: string, bits: number): boolean {
  if (!/^[0-9a-f]{64}$/i.test(digestHex)) return false;
  if (!Number.isInteger(bits) || bits < 1 || bits > 256) return false;
  const value = BigInt(`0x${digestHex}`);
  return (value >> BigInt(256 - bits)) === 0n;
}

export function hashPowAttempt(challenge_id: string, nonce: string): string {
  return crypto.createHash('sha256').update(`${challenge_id}:${nonce}`, 'utf8').digest('hex');
}

export async function verifyPowChallenge(challenge_id: unknown, nonce: unknown): Promise<boolean> {
  if (typeof challenge_id !== 'string' || typeof nonce !== 'string') return false;
  if (!/^[0-9a-f]{32}$/.test(challenge_id)) return false;
  if (!/^\d{1,20}$/.test(nonce)) return false;
  const key = `${PREFIX}${challenge_id}`;
  const raw = await redis.get(key);
  if (raw === null) return false;
  await redis.del(key); // single-use: consume on first attempt
  let bits: number;
  try {
    bits = (JSON.parse(raw) as { bits: number }).bits;
  } catch {
    return false;
  }
  if (!Number.isInteger(bits) || bits < 1 || bits > 32) return false;
  return meetsDifficulty(hashPowAttempt(challenge_id, nonce), bits);
}
