import { describe, it, expect, beforeEach, vi } from 'vitest';

const { store, rateLimits } = vi.hoisted(() => {
  const store = new Map<string, string>();
  const rateLimits = new Map<string, { count: number; reset: number }>();
  return { store, rateLimits };
});

vi.mock('./redis', () => ({
  redis: {
    get: vi.fn(async (k: string) => store.get(k) ?? null),
    set: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    del: vi.fn(async (...keys: string[]) => {
      for (const k of keys) store.delete(k);
    }),
    incr: vi.fn(async (k: string) => {
      const n = Number(store.get(k) ?? 0) + 1;
      store.set(k, String(n));
      return n;
    }),
    expire: vi.fn(async () => true),
  },
  atomicCheckRateLimit: vi.fn(
    async (key: string, _windowMs: number, limit: number) => {
      const now = Date.now();
      const entry = rateLimits.get(key);
      if (!entry || now > entry.reset) {
        rateLimits.set(key, { count: 1, reset: now + 3_600_000 });
        return {
          allowed: true,
          remaining: limit - 1,
          resetAt: new Date(now + 3_600_000),
        };
      }
      entry.count += 1;
      return {
        allowed: entry.count <= limit,
        remaining: Math.max(0, limit - entry.count),
        resetAt: new Date(entry.reset),
      };
    },
  ),
}));

import {
  issueOtp,
  verifyOtp,
  checkOtpSendRateLimit,
  OTP_TTL_SECONDS,
  OTP_MAX_ATTEMPTS,
} from './otp';

const EMAIL = 'alice@example.com';

function storedRecord(): { code_hash: string; attempts: number; expires: number } {
  const raw = store.get(`otp:login:${EMAIL}`);
  if (!raw) throw new Error('no stored OTP record');
  return JSON.parse(raw);
}

describe('issueOtp', () => {
  beforeEach(() => {
    store.clear();
    rateLimits.clear();
  });

  it('returns a 6-digit zero-padded code', async () => {
    const code = await issueOtp('login', EMAIL);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('stores only the SHA-256 hash, never the plaintext code', async () => {
    const code = await issueOtp('login', EMAIL);
    const record = storedRecord();
    expect(record.code_hash).not.toContain(code);
    expect(record.code_hash).toHaveLength(64);
    expect(record.attempts).toBe(0);
  });

  it('sets a 10-minute expiry on the record', async () => {
    await issueOtp('login', EMAIL);
    const record = storedRecord();
    expect(record.expires - Date.now()).toBeGreaterThan(
      (OTP_TTL_SECONDS - 5) * 1000,
    );
    expect(record.expires - Date.now()).toBeLessThanOrEqual(OTP_TTL_SECONDS * 1000);
  });

  it('scopes records per purpose and email', async () => {
    await issueOtp('login', EMAIL);
    await issueOtp('register', EMAIL);
    expect(store.has('otp:login:alice@example.com')).toBe(true);
    expect(store.has('otp:register:alice@example.com')).toBe(true);
  });
});

describe('verifyOtp', () => {
  beforeEach(() => {
    store.clear();
    rateLimits.clear();
  });

  it('accepts the correct code and consumes the OTP', async () => {
    const code = await issueOtp('login', EMAIL);
    expect(await verifyOtp('login', EMAIL, code)).toEqual({ ok: true });
    expect(store.has(`otp:login:${EMAIL}`)).toBe(false);
  });

  it('rejects a wrong code', async () => {
    await issueOtp('login', EMAIL);
    expect(await verifyOtp('login', EMAIL, '000000')).toEqual({
      ok: false,
      error: 'OTP_INVALID',
    });
  });

  it('counts failed attempts in the stored record', async () => {
    await issueOtp('login', EMAIL);
    await verifyOtp('login', EMAIL, '000000');
    expect(storedRecord().attempts).toBe(1);
  });

  it('rejects with OTP_EXPIRED when no OTP was issued', async () => {
    expect(await verifyOtp('login', EMAIL, '123456')).toEqual({
      ok: false,
      error: 'OTP_EXPIRED',
    });
  });

  it('rejects with OTP_EXPIRED for an expired record', async () => {
    store.set(
      `otp:login:${EMAIL}`,
      JSON.stringify({
        code_hash: 'a'.repeat(64),
        attempts: 0,
        expires: Date.now() - 1000,
      }),
    );
    expect(await verifyOtp('login', EMAIL, '123456')).toEqual({
      ok: false,
      error: 'OTP_EXPIRED',
    });
    expect(store.has(`otp:login:${EMAIL}`)).toBe(false);
  });

  it('locks the pair after OTP_MAX_ATTEMPTS failures', async () => {
    const code = await issueOtp('login', EMAIL);
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i += 1) {
      await verifyOtp('login', EMAIL, '000000');
    }
    // The correct code no longer works — the pair is locked out.
    expect(await verifyOtp('login', EMAIL, code)).toEqual({
      ok: false,
      error: 'OTP_ATTEMPTS_EXCEEDED',
    });
    expect(store.has(`otp:lock:login:${EMAIL}`)).toBe(true);
    expect(store.has(`otp:login:${EMAIL}`)).toBe(false);
  });

  it('keeps codes purpose-scoped (login code fails for register)', async () => {
    const code = await issueOtp('login', EMAIL);
    expect(await verifyOtp('register', EMAIL, code)).toEqual({
      ok: false,
      error: 'OTP_EXPIRED',
    });
  });
});

describe('checkOtpSendRateLimit', () => {
  beforeEach(() => {
    store.clear();
    rateLimits.clear();
  });

  it('allows sends within the limits', async () => {
    expect(await checkOtpSendRateLimit(EMAIL, '1.2.3.4')).toBe(true);
  });

  it('denies when the per-email limit is hit', async () => {
    expect(await checkOtpSendRateLimit(EMAIL, '1.2.3.4', { perEmail: 2 })).toBe(true);
    expect(await checkOtpSendRateLimit(EMAIL, '1.2.3.4', { perEmail: 2 })).toBe(true);
    expect(await checkOtpSendRateLimit(EMAIL, '1.2.3.4', { perEmail: 2 })).toBe(false);
  });

  it('denies when the per-IP limit is hit', async () => {
    expect(await checkOtpSendRateLimit('a@example.com', '1.2.3.4', { perIp: 1 })).toBe(true);
    expect(await checkOtpSendRateLimit('b@example.com', '1.2.3.4', { perIp: 1 })).toBe(false);
  });

  it('counts per-email and per-IP independently', async () => {
    expect(await checkOtpSendRateLimit(EMAIL, '1.2.3.4', { perEmail: 1, perIp: 1 })).toBe(true);
    // Same IP, new email: IP budget exhausted.
    expect(await checkOtpSendRateLimit('other@example.com', '1.2.3.4', { perEmail: 1, perIp: 1 })).toBe(false);
    // New IP, same email: email budget exhausted.
    expect(await checkOtpSendRateLimit(EMAIL, '9.9.9.9', { perEmail: 1, perIp: 1 })).toBe(false);
  });
});
