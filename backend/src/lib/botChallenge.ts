/**
 * Simple bot challenge for identity creation.
 *
 * Identity minting is the most abused endpoint (mass script registrations),
 * so claiming an identity requires solving a trivial human challenge first:
 * GET /api/users/challenge issues {challenge_id, a, b}, and POST /api/users/init
 * must answer a + b. Challenges are single-use and expire after 5 minutes.
 * This stops zero-effort scripts; it is not a CAPTCHA and does not claim to be.
 */
import crypto from 'crypto';
import { redis } from './redis';

const PREFIX = 'bot_challenge:';
const TTL_SECONDS = 300;

export interface BotChallenge {
  challenge_id: string;
  a: number;
  b: number;
}

export async function issueChallenge(): Promise<BotChallenge> {
  const a = 2 + crypto.randomInt(8);
  const b = 2 + crypto.randomInt(8);
  const challenge_id = crypto.randomBytes(12).toString('hex');
  await redis.set(`${PREFIX}${challenge_id}`, String(a + b), { EX: TTL_SECONDS });
  return { challenge_id, a, b };
}

export async function verifyChallenge(challenge_id: unknown, answer: unknown): Promise<boolean> {
  if (typeof challenge_id !== 'string' || !Number.isInteger(answer)) return false;
  if (challenge_id.length < 8 || challenge_id.length > 128) return false;
  const key = `${PREFIX}${challenge_id}`;
  const expected = await redis.get(key);
  if (expected === null) return false;
  await redis.del(key); // single-use: consume on first attempt
  return Number(expected) === answer;
}
