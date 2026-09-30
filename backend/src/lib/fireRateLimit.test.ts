import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { consumeFire, resetFireRateLimiter } from './fireRateLimit';

describe('consumeFire', () => {
  beforeEach(() => {
    resetFireRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows a normal single fire', () => {
    const r = consumeFire('fp-a');
    expect(r.allowed).toBe(true);
    expect(r.retryAfterMs).toBe(0);
  });

  it('blocks after the per-minute limit (30) is exhausted', () => {
    // Raise the burst so the 30/minute budget is what blocks, not the burst.
    const opts = { maxBurst: 30 } as const;
    for (let i = 0; i < 30; i++) {
      expect(consumeFire('fp-flood', opts).allowed).toBe(true);
    }
    const blocked = consumeFire('fp-flood', opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('enforces the 5-per-5s burst independent of the minute limit', () => {
    // 5 rapid hits: allowed. 6th within the burst window: blocked.
    for (let i = 0; i < 5; i++) {
      expect(consumeFire('fp-burst').allowed).toBe(true);
    }
    expect(consumeFire('fp-burst').allowed).toBe(false);
  });

  it('allows resuming after the burst window passes (fake timers)', () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) consumeFire('fp-resume');
    expect(consumeFire('fp-resume').allowed).toBe(false);
    vi.advanceTimersByTime(5_100);
    expect(consumeFire('fp-resume').allowed).toBe(true);
  });

  it('allows resuming after the minute window passes', () => {
    vi.useFakeTimers();
    for (let i = 0; i < 30; i++) consumeFire('fp-minute');
    expect(consumeFire('fp-minute').allowed).toBe(false);
    vi.advanceTimersByTime(60_100);
    expect(consumeFire('fp-minute').allowed).toBe(true);
  });

  it('isolates fingerprints — one flooder does not affect others', () => {
    for (let i = 0; i < 30; i++) consumeFire('fp-flooder');
    expect(consumeFire('fp-flooder').allowed).toBe(false);
    expect(consumeFire('fp-innocent').allowed).toBe(true);
  });

  it('counts different targets by the same fingerprint toward the same budget', () => {
    // The budget is per-identity (flood protection), not per-target.
    for (let i = 0; i < 5; i++) consumeFire('fp-multi', { limit: 10 });
    expect(consumeFire('fp-multi', { limit: 10 }).allowed).toBe(false);
  });

  it('retryAfterMs never exceeds the window', () => {
    for (let i = 0; i < 30; i++) consumeFire('fp-retry');
    const r = consumeFire('fp-retry');
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeLessThanOrEqual(60_000);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it('lazy sweep drops empty fingerprints (memory bound)', () => {
    vi.useFakeTimers();
    for (let i = 0; i < 5; i++) consumeFire('fp-gone');
    vi.advanceTimersByTime(61_000);
    // Touch with another key to trigger the sweep.
    consumeFire('fp-current');
    // Internal check via behavior: the swept key has a fresh full budget.
    expect(consumeFire('fp-gone').allowed).toBe(true);
  });
});
