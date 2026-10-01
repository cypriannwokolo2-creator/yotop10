import { Router, type Request, type Response } from 'express';
import { redis } from '../lib/redis';
import { AppError } from '../lib/errors';
import { logAudit } from '../lib/auditWriter';
import { getClientIp } from '../middleware/fingerprint';
import { userAuthMiddleware } from '../middleware/userAuth';
import {
  authRegisterSchema,
  authRegisterVerifySchema,
  authLoginSchema,
  authLoginVerifySchema,
  authLogin2faSchema,
  authForgotPasswordSchema,
  authResetPasswordSchema,
  authTwoFactorCodeSchema,
} from '../schemas/auth';
import {
  issueOtp,
  verifyOtp,
  checkOtpSendRateLimit,
} from '../lib/otp';
import { sendOtpEmail } from '../lib/brevo';
import { hashPassword, verifyPassword } from '../lib/passwords';
import {
  issueSessionToken,
  setSessionCookie,
  clearSessionCookie,
  generateDeviceKey,
  setDeviceKeyCookie,
  trustDevice,
  touchTrustedDevice,
  findTrustedDevice,
  getLoginLockStatus,
  recordLoginFailure,
  clearLoginFailures,
  createAuthUser,
  buildMeResponse,
  type SessionUser,
} from '../lib/userAuth';
import { User, type IUser } from '../models/User';
import {
  generateTotpSecret,
  buildOtpAuthUri,
  encryptTotpSecret,
  decryptTotpSecret,
  verifyTotp,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  looksLikeTotpCode,
} from '../lib/totp';

const router: Router = Router();

// Parse session_token cookie into req.session on every auth route.
router.use(userAuthMiddleware);

/** Registration payload TTL: user must verify email within 20 minutes. */
const REGISTRATION_TTL_SECONDS = 20 * 60;

/** Default OTP send limits (login): 5/hour per email, 10/hour per IP. */
const LOGIN_SEND_LIMITS = {};
/** Registration: 3/hour per email, 5/hour per IP (stricter). */
const REGISTER_SEND_LIMITS = { perEmail: 3, perIp: 5 } as const;
/** Password reset: 1/hour per email, 3/hour per IP (stricter). */
const RESET_SEND_LIMITS = { perEmail: 1, perIp: 3 } as const;

interface RegistrationPayload {
  email: string;
  username: string;
  password_hash: string;
}

type Handler = (req: Request, res: Response) => Promise<void>;

/** Wrap an async handler: map AppError to its status/code, log the rest. */
const handle =
  (fn: Handler): Handler =>
  async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code });
        return;
      }
      console.error('Auth route error:', err);
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
    }
  };

function zodError(err: { issues: Array<{ message: string }> }): AppError {
  return new AppError(err.issues.map((i) => i.message).join('; '), 'VALIDATION', 400);
}

function otpError(error: 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_ATTEMPTS_EXCEEDED'): AppError {
  if (error === 'OTP_EXPIRED') {
    return new AppError('Code expired. Request a new one.', 'OTP_EXPIRED', 400);
  }
  if (error === 'OTP_ATTEMPTS_EXCEEDED') {
    return new AppError('Too many failed attempts. Try again in 15 minutes.', 'OTP_ATTEMPTS_EXCEEDED', 429);
  }
  return new AppError('Invalid code', 'OTP_INVALID', 400);
}

function requireSession(req: Request): SessionUser {
  const session = req.session;
  if (!session) {
    throw new AppError('Not authenticated', 'UNAUTHORIZED', 401);
  }
  return session;
}

/** Structural subset of IUser needed to complete a password login. */
interface LoginUser {
  user_id: string;
  username: string;
  email?: string | null;
  token_version?: number;
  trusted_devices?: Array<{ id_hash: string }> | null;
  custom_display_name?: string | null;
  trust_score: number;
  created_at?: Date;
}

/**
 * Complete a password-authenticated login:
 * - trusted device_key cookie -> session immediately;
 * - otherwise email a login code and return requires_otp.
 */
async function completeLogin(
  req: Request,
  res: Response,
  user: LoginUser,
  ip: string,
): Promise<void> {
  const deviceKey = req.cookies?.device_key;
  const key = typeof deviceKey === 'string' ? deviceKey : undefined;

  if (findTrustedDevice(user.trusted_devices, key)) {
    const token = await issueSessionToken({
      user_id: user.user_id,
      username: user.username,
      token_version: user.token_version ?? 0,
    });
    setSessionCookie(res, token);
    if (key) touchTrustedDevice(user.user_id, key).catch(() => {});
    logAudit({
      admin_id: user.user_id,
      action: 'auth_login_success',
      ip,
      metadata: { user_id: user.user_id, trusted_device: true },
      user_agent: req.headers['user-agent'] || '',
    });
    res.json({ success: true, user: await buildMeResponse(user) });
    return;
  }

  if (!(await checkOtpSendRateLimit(user.email ?? '', ip, LOGIN_SEND_LIMITS))) {
    throw new AppError('Too many login code emails. Try again in an hour.', 'RATE_LIMITED', 429);
  }

  const code = await issueOtp('login', user.email ?? '');
  await sendOtpEmail(user.email ?? '', code, 'login');
  logAudit({
    admin_id: user.user_id,
    action: 'auth_login_otp_sent',
    ip,
    metadata: { email: user.email },
    user_agent: req.headers['user-agent'] || '',
  });
  res.json({ success: true, requires_otp: true });
}

/** Find the recovery-code hash matching `code`, or null. */
async function matchRecoveryCode(
  code: string,
  hashes: string[],
): Promise<string | null> {
  for (const hash of hashes) {
    if (await verifyRecoveryCode(code, hash)) return hash;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* POST /api/auth/register                                              */
/* ------------------------------------------------------------------ */

router.post('/register', handle(async (req, res) => {
  const parsed = authRegisterSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email, password, username } = parsed.data;
  const ip = getClientIp(req);

  if (!(await checkOtpSendRateLimit(email, ip, REGISTER_SEND_LIMITS))) {
    throw new AppError('Too many registration attempts. Try again in an hour.', 'RATE_LIMITED', 429);
  }

  const existingEmail = await User.findOne({ email }).select('_id').lean();
  if (existingEmail) {
    throw new AppError('Email already registered', 'EMAIL_TAKEN', 409);
  }
  const existingUsername = await User.findOne({ username }).select('_id').lean();
  if (existingUsername) {
    throw new AppError('Username already taken', 'USERNAME_TAKEN', 409);
  }

  const passwordHash = await hashPassword(password);
  await redis.set(
    `reg:${email}`,
    JSON.stringify({ email, username, password_hash: passwordHash } satisfies RegistrationPayload),
    { EX: REGISTRATION_TTL_SECONDS },
  );

  const code = await issueOtp('register', email);
  await sendOtpEmail(email, code, 'register');

  logAudit({
    admin_id: null,
    action: 'auth_register_initiated',
    ip,
    metadata: { email },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true, expires_in: 600 });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/register/verify                                       */
/* ------------------------------------------------------------------ */

router.post('/register/verify', handle(async (req, res) => {
  const parsed = authRegisterVerifySchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email, otp, password, username } = parsed.data;
  const ip = getClientIp(req);

  const raw = await redis.get(`reg:${email}`);
  if (!raw) {
    throw new AppError('Registration expired. Please register again.', 'REGISTRATION_EXPIRED', 400);
  }

  let record: RegistrationPayload;
  try {
    record = JSON.parse(raw) as RegistrationPayload;
  } catch {
    throw new AppError('Registration expired. Please register again.', 'REGISTRATION_EXPIRED', 400);
  }

  if (record.username !== username || !(await verifyPassword(password, record.password_hash))) {
    throw new AppError('Registration details do not match. Please register again.', 'VALIDATION', 400);
  }

  const result = await verifyOtp('register', email, otp);
  if (!result.ok) throw otpError(result.error);

  let user: IUser;
  try {
    user = await createAuthUser({ username, email, password_hash: record.password_hash });
  } catch (err) {
    if (err instanceof Error && err.message.includes('duplicate key')) {
      throw new AppError('Email or username already taken', 'EMAIL_TAKEN', 409);
    }
    throw err;
  }

  // Consume the registration payload so it cannot be replayed.
  await redis.del(`reg:${email}`);

  const token = await issueSessionToken({
    user_id: user.user_id,
    username: user.username,
    token_version: user.token_version ?? 0,
  });
  setSessionCookie(res, token);

  // The verifying device is trusted automatically.
  const deviceKey = generateDeviceKey();
  await trustDevice(user.user_id, deviceKey);
  setDeviceKeyCookie(res, deviceKey);

  logAudit({
    admin_id: user.user_id,
    action: 'auth_register_completed',
    ip,
    metadata: { user_id: user.user_id, username },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true, user: await buildMeResponse(user) });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/login                                                 */
/* ------------------------------------------------------------------ */

router.post('/login', handle(async (req, res) => {
  const parsed = authLoginSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email, password } = parsed.data;
  const ip = getClientIp(req);

  const lock = await getLoginLockStatus(email);
  if (lock.locked) {
    throw new AppError(
      `Account temporarily locked. Try again in ${lock.retryAfterSeconds} seconds.`,
      'ACCOUNT_LOCKED',
      429,
    );
  }

  const user = await User.findOne({ email }).lean();
  const passwordOk =
    user?.password_hash !== undefined && user.password_hash !== null
      ? await verifyPassword(password, user.password_hash)
      : false;

  if (!user || !passwordOk) {
    const locked = await recordLoginFailure(email);
    logAudit({
      admin_id: null,
      action: 'auth_login_failed',
      ip,
      metadata: { email, locked },
      user_agent: req.headers['user-agent'] || '',
    });
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  await clearLoginFailures(email);

  // 2FA-enabled accounts must pass the TOTP step before any device trust.
  if (user.two_factor?.enabled) {
    throw new AppError('Two-factor authentication required', 'TWO_FA_REQUIRED', 401);
  }

  await completeLogin(req, res, user, ip);
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/login/verify                                          */
/* ------------------------------------------------------------------ */

router.post('/login/verify', handle(async (req, res) => {
  const parsed = authLoginVerifySchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email, otp, trust_device } = parsed.data;
  const ip = getClientIp(req);

  const result = await verifyOtp('login', email, otp);
  if (!result.ok) throw otpError(result.error);

  const user = await User.findOne({ email }).lean();
  if (!user || user.legacy_anonymous || !user.password_hash) {
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  const token = await issueSessionToken({
    user_id: user.user_id,
    username: user.username,
    token_version: user.token_version ?? 0,
  });
  setSessionCookie(res, token);

  if (trust_device) {
    const deviceKey = generateDeviceKey();
    await trustDevice(user.user_id, deviceKey);
    setDeviceKeyCookie(res, deviceKey);
  }

  logAudit({
    admin_id: user.user_id,
    action: 'auth_login_success',
    ip,
    metadata: { user_id: user.user_id, trusted_device: trust_device },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true, user: await buildMeResponse(user) });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/login/2fa                                             */
/* ------------------------------------------------------------------ */

router.post('/login/2fa', handle(async (req, res) => {
  const parsed = authLogin2faSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email, code } = parsed.data;
  const ip = getClientIp(req);

  // 2FA failures count toward the login lockout so 6-digit TOTP
  // codes cannot be brute-forced (5 failures -> 15-minute lock,
  // mirroring the password path and the admin convention).
  const lock = await getLoginLockStatus(email);
  if (lock.locked) {
    throw new AppError(
      `Account temporarily locked. Try again in ${lock.retryAfterSeconds} seconds.`,
      'ACCOUNT_LOCKED',
      429,
    );
  }

  const user = await User.findOne({ email }).lean();
  if (!user?.two_factor?.enabled || !user.two_factor.secret) {
    throw new AppError('Invalid email or code', 'INVALID_CREDENTIALS', 401);
  }

  const secret = await decryptTotpSecret(user.two_factor.secret);
  const totpOk = looksLikeTotpCode(code) && verifyTotp(secret, code);

  let recoveryOk = false;
  let matchedHash: string | null = null;
  if (!totpOk && user.two_factor.recovery_codes_hash?.length) {
    matchedHash = await matchRecoveryCode(code, user.two_factor.recovery_codes_hash);
    recoveryOk = matchedHash !== null;
  }

  if (!totpOk && !recoveryOk) {
    const locked = await recordLoginFailure(email);
    logAudit({
      admin_id: null,
      action: 'auth_login_failed',
      ip,
      metadata: { email, two_fa: true, locked },
      user_agent: req.headers['user-agent'] || '',
    });
    throw new AppError('Invalid email or code', 'INVALID_CREDENTIALS', 401);
  }

  // Recovery codes are single-use.
  if (recoveryOk && matchedHash) {
    await User.updateOne({ user_id: user.user_id }, { $pull: { 'two_factor.recovery_codes_hash': matchedHash } });
  }

  await clearLoginFailures(email);
  await completeLogin(req, res, user, ip);
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/logout                                                */
/* ------------------------------------------------------------------ */

router.post('/logout', handle(async (req, res) => {
  const session = req.session;
  if (session) {
    // Bump token_version so this session's JWT is rejected everywhere.
    await User.updateOne({ user_id: session.user_id }, { $inc: { token_version: 1 } });
    logAudit({
      admin_id: session.user_id,
      action: 'auth_logout',
      ip: getClientIp(req),
      metadata: { user_id: session.user_id },
      user_agent: req.headers['user-agent'] || '',
    });
  }
  clearSessionCookie(res);
  res.json({ success: true });
}));

/* ------------------------------------------------------------------ */
/* GET /api/auth/me                                                     */
/* ------------------------------------------------------------------ */

router.get('/me', handle(async (req, res) => {
  const session = requireSession(req);
  res.json(await buildMeResponse(session));
}));

/* ------------------------------------------------------------------ */
/* GET /api/auth/2fa/setup                                              */
/* ------------------------------------------------------------------ */

router.get('/2fa/setup', handle(async (req, res) => {
  const session = requireSession(req);

  const user = await User.findOne({ user_id: session.user_id });
  if (!user) throw new AppError('Not authenticated', 'UNAUTHORIZED', 401);
  if (user.two_factor?.enabled) {
    throw new AppError('Two-factor authentication is already enabled', 'TWO_FA_ALREADY_ENABLED', 409);
  }

  const secret = generateTotpSecret();
  const recoveryCodes = generateRecoveryCodes();
  const [encryptedSecret, hashedCodes] = await Promise.all([
    encryptTotpSecret(secret),
    Promise.all(recoveryCodes.map(hashRecoveryCode)),
  ]);

  user.two_factor = {
    enabled: false,
    secret: encryptedSecret,
    recovery_codes_hash: hashedCodes,
  };
  await user.save();

  logAudit({
    admin_id: session.user_id,
    action: 'auth_2fa_setup',
    ip: getClientIp(req),
    metadata: { user_id: session.user_id },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ secret_uri: buildOtpAuthUri(secret, user.username), recovery_codes: recoveryCodes });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/2fa/enable                                            */
/* ------------------------------------------------------------------ */

router.post('/2fa/enable', handle(async (req, res) => {
  const session = requireSession(req);
  const parsed = authTwoFactorCodeSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { code } = parsed.data;

  const user = await User.findOne({ user_id: session.user_id });
  if (!user) throw new AppError('Not authenticated', 'UNAUTHORIZED', 401);
  if (user.two_factor?.enabled) {
    throw new AppError('Two-factor authentication is already enabled', 'TWO_FA_ALREADY_ENABLED', 409);
  }
  if (!user.two_factor?.secret) {
    throw new AppError('Run 2FA setup first', 'TWO_FA_NOT_SETUP', 400);
  }
  if (!looksLikeTotpCode(code)) {
    throw new AppError('Enter the 6-digit authenticator code to enable 2FA', 'VALIDATION', 400);
  }

  const secret = await decryptTotpSecret(user.two_factor.secret);
  if (!verifyTotp(secret, code)) {
    throw new AppError('Invalid code', 'TWO_FA_CODE_INVALID', 400);
  }

  user.two_factor.enabled = true;
  await user.save();

  logAudit({
    admin_id: session.user_id,
    action: 'auth_2fa_enable',
    ip: getClientIp(req),
    metadata: { user_id: session.user_id },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true, enabled: true });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/2fa/disable                                           */
/* ------------------------------------------------------------------ */

router.post('/2fa/disable', handle(async (req, res) => {
  const session = requireSession(req);
  const parsed = authTwoFactorCodeSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { code } = parsed.data;

  const user = await User.findOne({ user_id: session.user_id });
  if (!user) throw new AppError('Not authenticated', 'UNAUTHORIZED', 401);
  if (!user.two_factor?.enabled) {
    throw new AppError('Two-factor authentication is not enabled', 'TWO_FA_NOT_ENABLED', 400);
  }

  const totpOk =
    !!user.two_factor.secret &&
    looksLikeTotpCode(code) &&
    verifyTotp(await decryptTotpSecret(user.two_factor.secret), code);

  let matchedHash: string | null = null;
  if (!totpOk && user.two_factor.recovery_codes_hash?.length) {
    matchedHash = await matchRecoveryCode(code, user.two_factor.recovery_codes_hash);
  }

  if (!totpOk && !matchedHash) {
    throw new AppError('Invalid code', 'TWO_FA_CODE_INVALID', 400);
  }

  // Recovery codes are single-use.
  if (!totpOk && matchedHash) {
    await User.updateOne({ user_id: user.user_id }, { $pull: { 'two_factor.recovery_codes_hash': matchedHash } });
  }

  user.two_factor = { enabled: false, recovery_codes_hash: [] };
  await user.save();

  logAudit({
    admin_id: session.user_id,
    action: 'auth_2fa_disable',
    ip: getClientIp(req),
    metadata: { user_id: session.user_id },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true, enabled: false });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/2fa/recovery  (regenerate recovery codes)             */
/* ------------------------------------------------------------------ */

router.post('/2fa/recovery', handle(async (req, res) => {
  const session = requireSession(req);
  const parsed = authTwoFactorCodeSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { code } = parsed.data;

  const user = await User.findOne({ user_id: session.user_id });
  if (!user) throw new AppError('Not authenticated', 'UNAUTHORIZED', 401);
  if (!user.two_factor?.enabled) {
    throw new AppError('Two-factor authentication is not enabled', 'TWO_FA_NOT_ENABLED', 400);
  }

  const totpOk =
    !!user.two_factor.secret &&
    looksLikeTotpCode(code) &&
    verifyTotp(await decryptTotpSecret(user.two_factor.secret), code);

  let matchedHash: string | null = null;
  if (!totpOk && user.two_factor.recovery_codes_hash?.length) {
    matchedHash = await matchRecoveryCode(code, user.two_factor.recovery_codes_hash);
  }

  if (!totpOk && !matchedHash) {
    throw new AppError('Invalid code', 'TWO_FA_CODE_INVALID', 400);
  }

  // Regenerate: old codes (including the one just used) are invalidated.
  const newCodes = generateRecoveryCodes();
  user.two_factor.recovery_codes_hash = await Promise.all(newCodes.map(hashRecoveryCode));
  await user.save();

  logAudit({
    admin_id: session.user_id,
    action: 'auth_2fa_recovery_regenerate',
    ip: getClientIp(req),
    metadata: { user_id: session.user_id },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true, recovery_codes: newCodes });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/forgot-password                                       */
/* ------------------------------------------------------------------ */

router.post('/forgot-password', handle(async (req, res) => {
  const parsed = authForgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email } = parsed.data;
  const ip = getClientIp(req);

  // No account enumeration: identical response whether or not the email exists.
  const user = await User.findOne({ email }).select('password_hash').lean();
  if (user?.password_hash) {
    const allowed = await checkOtpSendRateLimit(email, ip, RESET_SEND_LIMITS);
    if (allowed) {
      const code = await issueOtp('reset', email);
      await sendOtpEmail(email, code, 'reset');
    }
  }

  logAudit({
    admin_id: null,
    action: 'auth_forgot_password',
    ip,
    metadata: { email },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true });
}));

/* ------------------------------------------------------------------ */
/* POST /api/auth/reset-password                                        */
/* ------------------------------------------------------------------ */

router.post('/reset-password', handle(async (req, res) => {
  const parsed = authResetPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw zodError(parsed.error);

  const { email, otp, new_password: newPassword } = parsed.data;
  const ip = getClientIp(req);

  const result = await verifyOtp('reset', email, otp);
  if (!result.ok) throw otpError(result.error);

  const user = await User.findOne({ email }).lean();
  if (!user?.password_hash) {
    throw new AppError('Invalid or expired code', 'OTP_INVALID', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await User.updateOne(
    { user_id: user.user_id },
    {
      $set: { password_hash: passwordHash, trusted_devices: [] },
      $inc: { token_version: 1 },
    },
  );
  await clearLoginFailures(email);

  logAudit({
    admin_id: user.user_id,
    action: 'auth_password_reset',
    ip,
    metadata: { user_id: user.user_id },
    user_agent: req.headers['user-agent'] || '',
  });

  res.json({ success: true });
}));

export default router;
