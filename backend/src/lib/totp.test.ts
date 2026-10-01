import { describe, it, expect } from 'vitest';

// SecretsManager falls back to env vars — required for TOTP encryption tests.
// JWT_SECRET must be >= 64 chars (lib/secrets.ts MIN_JWT_SECRET_LENGTH).
process.env.JWT_SECRET =
  'm41-unit-test-jwt-secret-0123456789abcdefghijklmnopqrstuvwxyz000';

import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  buildOtpAuthUri,
  totpCode,
  verifyTotp,
  encryptTotpSecret,
  decryptTotpSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  looksLikeTotpCode,
} from './totp';

const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // base32("12345678901234567890")

describe('base32', () => {
  it('encodes "foobar" to the RFC 4648 test vector (unpadded)', () => {
    expect(base32Encode(Buffer.from('foobar'))).toBe('MZXW6YTBOI');
  });

  it('decodes the RFC 4648 test vector back to "foobar"', () => {
    expect(base32Decode('MZXW6YTBOI').toString()).toBe('foobar');
  });

  it('round-trips arbitrary bytes', () => {
    const bytes = Buffer.from([0, 1, 2, 255, 128, 64, 32, 16, 8]);
    expect(base32Decode(base32Encode(bytes)).equals(bytes)).toBe(true);
  });

  it('decodes lowercase input with padding', () => {
    expect(base32Decode('mzxw6ytboi======').toString()).toBe('foobar');
  });

  it('rejects invalid characters', () => {
    expect(() => base32Decode('ABCD1')).toThrow(/Invalid base32 character/);
  });
});

describe('generateTotpSecret', () => {
  it('returns a 32-char base32 secret for 20 bytes', () => {
    const secret = generateTotpSecret();
    expect(secret).toHaveLength(32);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('uses the requested byte length', () => {
    expect(generateTotpSecret(10)).toHaveLength(16);
  });
});

describe('buildOtpAuthUri', () => {
  it('builds an otpauth:// URI with the secret and account', () => {
    const uri = buildOtpAuthUri(RFC_SECRET, 'alice@example.com');
    // WHATWG URL parses non-special schemes with "//" as host:path,
    // so assert the raw prefix and read params off the parsed URL.
    expect(uri).toMatch(
      /^otpauth:\/\/totp\/YoTop10:alice%40example.com\?/,
    );
    const url = new URL(uri);
    expect(url.protocol).toBe('otpauth:');
    expect(url.host).toBe('totp');
    expect(url.searchParams.get('secret')).toBe(RFC_SECRET);
    expect(url.searchParams.get('issuer')).toBe('YoTop10');
    expect(url.searchParams.get('digits')).toBe('6');
    expect(url.searchParams.get('period')).toBe('30');
    expect(url.searchParams.get('algorithm')).toBe('SHA1');
  });
});

describe('totpCode (RFC 6238 known-answer)', () => {
  // RFC 6238 Appendix B lists TIME IN SECONDS (T0=0, 30s step);
  // totpCode() takes the time step, so convert with floor(sec / 30).
  it('matches the RFC 6238 SHA1 vector for time 59s (step 1)', () => {
    expect(totpCode(RFC_SECRET, Math.floor(59 / 30))).toBe('287082');
  });

  it('matches the RFC 6238 SHA1 vector for time 1111111109s', () => {
    expect(totpCode(RFC_SECRET, Math.floor(1111111109 / 30))).toBe('081804');
  });

  it('zero-pads to 6 digits', () => {
    // Scan a few steps to find a code with a leading zero, if any.
    const codes = Array.from({ length: 50 }, (_, i) => totpCode(RFC_SECRET, i));
    expect(codes.every((c) => /^\d{6}$/.test(c))).toBe(true);
  });
});

describe('verifyTotp', () => {
  const nowMs = 1_700_000_000_000;
  const step = Math.floor(nowMs / 1000 / 30);

  it('accepts the current code', () => {
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step), nowMs)).toBe(true);
  });

  it('accepts the previous and next step (±1 window)', () => {
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step - 1), nowMs)).toBe(true);
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 1), nowMs)).toBe(true);
  });

  it('rejects a code two steps away', () => {
    expect(verifyTotp(RFC_SECRET, totpCode(RFC_SECRET, step + 2), nowMs)).toBe(false);
  });

  it('rejects a wrong code', () => {
    expect(verifyTotp(RFC_SECRET, '000000', nowMs)).toBe(false);
  });
});

describe('TOTP secret encryption (AES-256-GCM)', () => {
  it('round-trips a secret', async () => {
    const encrypted = await encryptTotpSecret(RFC_SECRET);
    expect(encrypted).not.toContain(RFC_SECRET);
    expect(await decryptTotpSecret(encrypted)).toBe(RFC_SECRET);
  });

  it('produces distinct ciphertexts (random IV)', async () => {
    const a = await encryptTotpSecret(RFC_SECRET);
    const b = await encryptTotpSecret(RFC_SECRET);
    expect(a).not.toBe(b);
  });

  it('rejects malformed stored values', async () => {
    await expect(decryptTotpSecret('not-a-valid-secret')).rejects.toThrow(
      /Malformed encrypted TOTP secret/,
    );
  });
});

describe('recovery codes', () => {
  it('generates 10 unique 10-char codes from the unambiguous alphabet', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    for (const code of codes) {
      expect(code).toHaveLength(10);
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    }
    expect(new Set(codes).size).toBe(10);
  });

  it('generates a custom count', () => {
    expect(generateRecoveryCodes(3)).toHaveLength(3);
  });

  it('hashes and verifies a recovery code (case-insensitive)', async () => {
    const hash = await hashRecoveryCode('abcdefgh29');
    expect(await verifyRecoveryCode('abcdefgh29', hash)).toBe(true);
    expect(await verifyRecoveryCode('ABCDEFGH29', hash)).toBe(true);
  });

  it('rejects a wrong recovery code', async () => {
    const hash = await hashRecoveryCode('abcdefgh29');
    expect(await verifyRecoveryCode('ZZZZZZZZ99', hash)).toBe(false);
  });
});

describe('looksLikeTotpCode', () => {
  it('accepts 6 digits', () => {
    expect(looksLikeTotpCode('123456')).toBe(true);
  });

  it('rejects non-6-digit shapes (recovery codes are 10 chars)', () => {
    expect(looksLikeTotpCode('12345')).toBe(false);
    expect(looksLikeTotpCode('ABCDEFGH29')).toBe(false);
    expect(looksLikeTotpCode('1234567')).toBe(false);
  });
});
