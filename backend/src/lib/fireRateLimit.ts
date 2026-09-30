/**
 * In-memory sliding-window rate limiter for fire reactions.
 *
 * Single-server deployment (AGENTS.md infra context): the backend runs as one
 * process, so in-memory is correct and dependency-free. The redis container is
 * currently unused by the backend. Documented caveat: counters reset on server
 * restart, and limits are per-instance if the backend ever scales horizontally.
 *
 * Algorithm: sliding window of timestamps per key, with a bounded burst so a
 * legit rapid double-tap (fire → unfire → fire) is never blocked while floods
 * are. Stale entries are pruned lazily on touch; a full sweep runs at most
 * once per window to bound memory from many distinct fingerprints.
 */

const WINDOW_MS = 60_000;
const MAX_BURST = 5;
const LIMIT = 30;

const hits = new Map<string, number[]>();
let lastSweep = 0;

export interface FireRateResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function consumeFire(
  key: string,
  opts: { limit?: number; windowMs?: number; maxBurst?: number } = {}
): FireRateResult {
  const limit = opts.limit ?? LIMIT;
  const windowMs = opts.windowMs ?? WINDOW_MS;
  const maxBurst = opts.maxBurst ?? MAX_BURST;
  const now = Date.now();

  if (now - lastSweep > windowMs) {
    lastSweep = now;
    for (const [k, stamps] of hits) {
      const alive = stamps.filter((t) => now - t < windowMs);
      if (alive.length === 0) hits.delete(k);
      else hits.set(k, alive);
    }
  }

  const stamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  const oldest = stamps[0];
  if (stamps.length >= limit) {
    return { allowed: false, retryAfterMs: oldest !== undefined ? windowMs - (now - oldest) : windowMs };
  }
  const recent = stamps.filter((t) => now - t < maxBurst);
  if (recent.length >= maxBurst) {
    const burstOldest = recent[0];
    return { allowed: false, retryAfterMs: burstOldest !== undefined ? maxBurst - (now - burstOldest) : maxBurst };
  }

  stamps.push(now);
  hits.set(key, stamps);
  return { allowed: true, retryAfterMs: 0 };
}

/** Test-only: reset all state between tests. */
export function resetFireRateLimiter(): void {
  hits.clear();
  lastSweep = 0;
}
