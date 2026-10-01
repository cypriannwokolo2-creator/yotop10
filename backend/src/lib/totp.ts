import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SecretsManager } from './secrets';

/** RFC 6238 parameters. */
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
export const TOTP_WINDOW_STEPS = 1;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE32_LOOKUP = new Map<string, number>();
for (let i = 0; i < BASE32_ALPHABET.length; i += 1) {
  BASE32_LOOKUP.set(BASE32_ALPHABET[i], i);
}

/** Alphabet without visually ambiguous characters (no I, L, O, 0, 1). */
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const RECOVERY_CODE_LENGTH = 10;
const RECOVERY_CODE_COUNT = 10;

/* ------------------------------------------------------------------ */
/* Base32 (RFC 4648) — for otpauth:// URIs and shared secrets          */
/* ------------------------------------------------------------------ */

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

export function base32Decode(encoded: string): Buffer {
  const normalized = encoded.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of normalized) {
    const digit = BASE32_LOOKUP.get(char);
    if (digit === undefined) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(bytes);
}

/** 20 random bytes → 32-char base32 secret (80 bits of entropy). */
export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

/** Build the otpauth:// URI for authenticator apps. */
export function buildOtpAuthUri(secretBase32: string, accountName: string, issuer = 'YoTop10'): string {
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
}

/* ------------------------------------------------------------------ */
/* RFC 6238 TOTP                                                       */
/* ------------------------------------------------------------------ */

/** Compute the 6-digit TOTP for an explicit time step (30s periods since epoch). */
export function totpCode(secretBase32: string, timeStep: number): string {
  const key = base32Decode(secretBase32);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(timeStep)), 0);

  const hmac = crypto.createHmac('sha1', key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

/** Verify a user-supplied TOTP within the ±1 step window. */
export function verifyTotp(secretBase32: string, code: string, nowMs = Date.now()): boolean {
  const currentStep = Math.floor(nowMs / 1000 / TOTP_STEP_SECONDS);
  for (let delta = -TOTP_WINDOW_STEPS; delta <= TOTP_WINDOW_STEPS; delta += 1) {
    if (totpCode(secretBase32, currentStep + delta) === code) {
      return true;
    }
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* AES-256-GCM encryption of TOTP secrets at rest                      */
/* ------------------------------------------------------------------ */

let encryptionKeyPromise: Promise<Buffer> | null = null;

/** Derive a 32-byte AES key from JWT_SECRET (domain-separated). */
async function getTotpEncryptionKey(): Promise<Buffer> {
  if (!encryptionKeyPromise) {
    encryptionKeyPromise = (async () => {
      const jwtSecret = await SecretsManager.getSecret('JWT_SECRET');
      return crypto
        .createHash('sha256')
        .update('yotop10:totp:v1:')
        .update(jwtSecret)
        .digest();
    })();
  }
  return encryptionKeyPromise;
}

/** Encrypt as `iv_hex:auth_tag_hex:ciphertext_hex`. */
export async function encryptTotpSecret(plainSecret: string): Promise<string> {
  const key = await getTotpEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainSecret, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export async function decryptTotpSecret(stored: string): Promise<string> {
  const key = await getTotpEncryptionKey();
  const [ivHex, tagHex, ciphertextHex] = stored.split(':');
  if (!ivHex || !tagHex || !ciphertextHex) {
    throw new Error('Malformed encrypted TOTP secret');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

/* ------------------------------------------------------------------ */
/* Recovery codes — single-use fallbacks, stored bcrypt-hashed         */
/* ------------------------------------------------------------------ */

export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, () =>
    Array.from({ length: RECOVERY_CODE_LENGTH }, () =>
      RECOVERY_CODE_ALPHABET[crypto.randomInt(RECOVERY_CODE_ALPHABET.length)],
    ).join(''),
  );
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(code.toUpperCase(), 12);
}

export async function verifyRecoveryCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code.toUpperCase(), hash);
}

/** A TOTP is 6 digits; recovery codes are 10 chars — distinguishable by shape. */
export function looksLikeTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
