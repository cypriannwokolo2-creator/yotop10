import crypto from 'crypto';
import { redis, atomicCheckRateLimit } from './redis';

export type OtpPurpose = 'register' | 'login' | 'reset';

export const OTP_TTL_SECONDS = 600; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCKOUT_SECONDS = 15 * 60; // 15 minutes
/** Default send limits (login): 5/hour per email, 10/hour per IP. */
export const OTP_SEND_PER_EMAIL_PER_HOUR = 5;
export const OTP_SEND_PER_IP_PER_HOUR = 10;

interface OtpRecord {
  code_hash: string;
  attempts: number;
  expires: number;
}

export type OtpVerifyError = 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_ATTEMPTS_EXCEEDED';

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; error: OtpVerifyError };

function otpKey(purpose: OtpPurpose, email: string): string {
  return `otp:${purpose}:${email}`;
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Constant-time comparison of two SHA-256 hex digests. Both sides are
 * always 32 bytes, so length is not a secret.
 */
function constantTimeHexEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Generate a 6-digit code (zero-padded) and store only its SHA-256 hash. */
export async function issueOtp(purpose: OtpPurpose, email: string): Promise<string> {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const record: OtpRecord = {
    code_hash: sha256Hex(code),
    attempts: 0,
    expires: Date.now() + OTP_TTL_SECONDS * 1000,
  };
  await redis.set(otpKey(purpose, email), JSON.stringify(record), { EX: OTP_TTL_SECONDS });
  return code;
}

/**
 * Verify a 6-digit OTP. Failed attempts are counted; reaching
 * OTP_MAX_ATTEMPTS locks the purpose+email pair for 15 minutes.
 * A successful verify consumes the OTP immediately.
 */
export async function verifyOtp(
  purpose: OtpPurpose,
  email: string,
  code: string,
): Promise<OtpVerifyResult> {
  const lockKey = `otp:lock:${purpose}:${email}`;
  if ((await redis.get(lockKey)) !== null) {
    return { ok: false, error: 'OTP_ATTEMPTS_EXCEEDED' };
  }

  const key = otpKey(purpose, email);
  const raw = await redis.get(key);
  if (!raw) {
    return { ok: false, error: 'OTP_EXPIRED' };
  }

  let record: OtpRecord;
  try {
    record = JSON.parse(raw) as OtpRecord;
  } catch {
    await redis.del(key);
    return { ok: false, error: 'OTP_EXPIRED' };
  }

  if (Date.now() > record.expires) {
    await redis.del(key);
    return { ok: false, error: 'OTP_EXPIRED' };
  }

  if (constantTimeHexEquals(sha256Hex(code), record.code_hash)) {
    await redis.del(key);
    return { ok: true };
  }

  const attempts = record.attempts + 1;
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(key);
    await redis.set(lockKey, '1', { EX: OTP_LOCKOUT_SECONDS });
    return { ok: false, error: 'OTP_ATTEMPTS_EXCEEDED' };
  }

  const remainingSeconds = Math.max(1, Math.ceil((record.expires - Date.now()) / 1000));
  await redis.set(
    key,
    JSON.stringify({ ...record, attempts }),
    { EX: remainingSeconds },
  );
  return { ok: false, error: 'OTP_INVALID' };
}

/**
 * Send-rate limit for OTP emails: per-email and per-IP sliding windows.
 * Returns true when sending is allowed. Defaults apply to login; registration
 * and password reset pass tighter limits (docs/plans-auth-m41.md §4.1, §4.6).
 */
export async function checkOtpSendRateLimit(
  email: string,
  ip: string,
  limits: { perEmail?: number; perIp?: number } = {},
): Promise<boolean> {
  const emailLimit = await atomicCheckRateLimit(
    `otp:send:${email}`,
    3600000,
    limits.perEmail ?? OTP_SEND_PER_EMAIL_PER_HOUR,
  );
  if (!emailLimit.allowed) return false;
  const ipLimit = await atomicCheckRateLimit(
    `otp:send:ip:${ip}`,
    3600000,
    limits.perIp ?? OTP_SEND_PER_IP_PER_HOUR,
  );
  return ipLimit.allowed;
}
