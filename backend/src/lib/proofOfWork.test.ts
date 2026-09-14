import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, string>();

vi.mock('./redis', () => ({
  redis: {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => (store.has(k) ? store.get(k)! : null)),
    del: vi.fn(async (k: string) => { store.delete(k); }),
  },
}));

import { issuePowChallenge, verifyPowChallenge, meetsDifficulty, hashPowAttempt } from './proofOfWork';

function solve(seed: string, bits: number): string {
  let nonce = 0;
  for (;;) {
    const s = String(nonce);
    if (meetsDifficulty(hashPowAttempt(seed, s), bits)) return s;
    nonce += 1;
  }
}

describe('proofOfWork', () => {
  beforeEach(() => { store.clear(); });

  it('accepts a correctly mined nonce (easy difficulty for speed)', async () => {
    const c = await issuePowChallenge(4);
    expect(c.difficulty).toBe(4);
    expect(await verifyPowChallenge(c.challenge_id, solve(c.challenge_id, 4))).toBe(true);
  });

  it('is single-use and rejects wrong answers', async () => {
    const c = await issuePowChallenge(4);
    const good = solve(c.challenge_id, 4);
    expect(await verifyPowChallenge(c.challenge_id, good)).toBe(true);
    expect(await verifyPowChallenge(c.challenge_id, good)).toBe(false);
    const c2 = await issuePowChallenge(4);
    expect(await verifyPowChallenge(c2.challenge_id, '0')).toBe(
      meetsDifficulty(hashPowAttempt(c2.challenge_id, '0'), 4),
    );
  });

  it('rejects malformed input', async () => {
    expect(await verifyPowChallenge('nope', '5')).toBe(false);
    expect(await verifyPowChallenge('a'.repeat(32), 'x')).toBe(false);
    expect(await verifyPowChallenge('a'.repeat(32), 5 as unknown as string)).toBe(false);
  });

  it('meetsDifficulty checks leading zero bits', () => {
    expect(meetsDifficulty('0'.repeat(64), 256)).toBe(true);
    expect(meetsDifficulty('f'.repeat(64), 1)).toBe(false);
    expect(meetsDifficulty('00ff' + '0'.repeat(60), 8)).toBe(true);
    expect(meetsDifficulty('00ff' + '0'.repeat(60), 9)).toBe(false);
    expect(meetsDifficulty('notahexdigest', 4)).toBe(false);
  });
});
