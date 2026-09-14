import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, string>();

vi.mock('./redis', () => ({
  redis: {
    set: vi.fn(async (k: string, v: string) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => (store.has(k) ? store.get(k)! : null)),
    del: vi.fn(async (k: string) => { store.delete(k); }),
  },
}));

import { issueChallenge, verifyChallenge } from './botChallenge';

describe('botChallenge', () => {
  beforeEach(() => { store.clear(); });

  it('issues a solvable challenge', async () => {
    const c = await issueChallenge();
    expect(c.challenge_id).toMatch(/^[0-9a-f]{24}$/);
    expect(await verifyChallenge(c.challenge_id, c.a + c.b)).toBe(true);
  });

  it('is single-use', async () => {
    const c = await issueChallenge();
    expect(await verifyChallenge(c.challenge_id, c.a + c.b)).toBe(true);
    expect(await verifyChallenge(c.challenge_id, c.a + c.b)).toBe(false);
  });

  it('rejects wrong answers and unknown ids', async () => {
    const c = await issueChallenge();
    expect(await verifyChallenge(c.challenge_id, c.a + c.b + 1)).toBe(false);
    expect(await verifyChallenge('nope-nope-nope', 5)).toBe(false);
    expect(await verifyChallenge(c.challenge_id, 'x' as unknown as number)).toBe(false);
  });
});
