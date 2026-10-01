import { z } from 'zod';

/**
 * M41.1 auth schemas (docs/plans-auth-m41.md §4).
 *
 * Password rule: min 8 chars, at least one letter + one number.
 * Username rule: 3–32 chars, lowercase alphanumeric + underscore.
 * OTP / 2FA codes: 6 digits; recovery codes are 10-char [A-Z0-9]
 * and are accepted by the 2FA endpoints via the same `code` field.
 */

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address');

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const usernameField = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, underscores only');

const otpField = z.string().regex(/^\d{6}$/, 'Code must be 6 digits');

// Accepts a 6-digit TOTP or a 10-char recovery code.
const twoFactorCodeField = z
  .string()
  .trim()
  .min(6, 'Code must be a 6-digit authenticator code or a recovery code')
  .max(10, 'Code must be a 6-digit authenticator code or a recovery code');

export const authRegisterSchema = z.object({
  email: emailField,
  password: passwordField,
  username: usernameField,
});

export const authRegisterVerifySchema = z.object({
  email: emailField,
  otp: otpField,
  password: passwordField,
  username: usernameField,
});

export const authLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const authLoginVerifySchema = z.object({
  email: emailField,
  otp: otpField,
  trust_device: z.boolean().optional(),
});

export const authLogin2faSchema = z.object({
  email: emailField,
  code: twoFactorCodeField,
});

export const authForgotPasswordSchema = z.object({
  email: emailField,
});

export const authResetPasswordSchema = z.object({
  email: emailField,
  otp: otpField,
  new_password: passwordField,
});

export const authTwoFactorCodeSchema = z.object({
  code: twoFactorCodeField,
});

export type AuthRegisterBody = z.infer<typeof authRegisterSchema>;
export type AuthRegisterVerifyBody = z.infer<typeof authRegisterVerifySchema>;
export type AuthLoginBody = z.infer<typeof authLoginSchema>;
export type AuthLoginVerifyBody = z.infer<typeof authLoginVerifySchema>;
export type AuthLogin2faBody = z.infer<typeof authLogin2faSchema>;
export type AuthForgotPasswordBody = z.infer<typeof authForgotPasswordSchema>;
export type AuthResetPasswordBody = z.infer<typeof authResetPasswordSchema>;
export type AuthTwoFactorCodeBody = z.infer<typeof authTwoFactorCodeSchema>;
