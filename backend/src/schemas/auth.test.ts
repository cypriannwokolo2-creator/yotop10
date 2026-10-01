import { describe, it, expect } from 'vitest';
import {
  authRegisterSchema,
  authRegisterVerifySchema,
  authLoginSchema,
  authLoginVerifySchema,
  authLogin2faSchema,
  authForgotPasswordSchema,
  authResetPasswordSchema,
  authTwoFactorCodeSchema,
} from './auth';

const validRegistration = {
  email: 'Alice@Example.com',
  password: 'password123',
  username: 'alice_1',
};

describe('authRegisterSchema', () => {
  it('accepts a valid registration', () => {
    const parsed = authRegisterSchema.parse(validRegistration);
    // Email is normalized to lowercase.
    expect(parsed.email).toBe('alice@example.com');
    expect(parsed.username).toBe('alice_1');
  });

  it('rejects an invalid email', () => {
    expect(authRegisterSchema.safeParse({ ...validRegistration, email: 'nope' }).success).toBe(false);
  });

  it('rejects a short password', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, password: 'short1' }).success,
    ).toBe(false);
  });

  it('rejects a password without a number', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, password: 'password' }).success,
    ).toBe(false);
  });

  it('rejects a password without a letter', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, password: '12345678' }).success,
    ).toBe(false);
  });

  it('rejects a short username', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, username: 'ab' }).success,
    ).toBe(false);
  });

  it('rejects a username over 32 chars', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, username: 'a'.repeat(33) }).success,
    ).toBe(false);
  });

  it('rejects a username with uppercase or symbols', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, username: 'Alice!' }).success,
    ).toBe(false);
  });

  it('accepts a 32-char username of lowercase letters, numbers, underscores', () => {
    expect(
      authRegisterSchema.safeParse({ ...validRegistration, username: 'a'.repeat(32) }).success,
    ).toBe(true);
  });
});

describe('authRegisterVerifySchema', () => {
  it('accepts email, 6-digit OTP, password and username', () => {
    const parsed = authRegisterVerifySchema.parse({
      ...validRegistration,
      otp: '123456',
    });
    expect(parsed.otp).toBe('123456');
  });

  it('rejects a non-6-digit OTP', () => {
    expect(
      authRegisterVerifySchema.safeParse({ ...validRegistration, otp: '12345' }).success,
    ).toBe(false);
  });
});

describe('authLoginSchema', () => {
  it('accepts email and non-empty password', () => {
    expect(
      authLoginSchema.parse({ email: 'alice@example.com', password: 'anything' }),
    ).toEqual({ email: 'alice@example.com', password: 'anything' });
  });

  it('rejects an empty password', () => {
    expect(
      authLoginSchema.safeParse({ email: 'alice@example.com', password: '' }).success,
    ).toBe(false);
  });
});

describe('authLoginVerifySchema', () => {
  it('accepts email, OTP and optional trust_device', () => {
    expect(
      authLoginVerifySchema.parse({
        email: 'alice@example.com',
        otp: '654321',
        trust_device: true,
      }),
    ).toEqual({ email: 'alice@example.com', otp: '654321', trust_device: true });
  });

  it('makes trust_device optional', () => {
    expect(
      authLoginVerifySchema.parse({ email: 'alice@example.com', otp: '654321' }),
    ).toEqual({ email: 'alice@example.com', otp: '654321' });
  });

  it('rejects a non-boolean trust_device', () => {
    expect(
      authLoginVerifySchema.safeParse({
        email: 'alice@example.com',
        otp: '654321',
        trust_device: 'yes',
      }).success,
    ).toBe(false);
  });
});

describe('authLogin2faSchema', () => {
  it('accepts a 6-digit TOTP', () => {
    expect(authLogin2faSchema.parse({ email: 'a@b.co', code: '123456' }).code).toBe('123456');
  });

  it('accepts a 10-char recovery code', () => {
    expect(authLogin2faSchema.parse({ email: 'a@b.co', code: 'ABCDEFGH29' }).code).toBe('ABCDEFGH29');
  });

  it('rejects codes outside the 6–10 char range', () => {
    expect(authLogin2faSchema.safeParse({ email: 'a@b.co', code: '12345' }).success).toBe(false);
    expect(authLogin2faSchema.safeParse({ email: 'a@b.co', code: 'ABCDEFGHIJ1' }).success).toBe(false);
  });
});

describe('authForgotPasswordSchema', () => {
  it('accepts an email', () => {
    expect(authForgotPasswordSchema.parse({ email: 'a@b.co' })).toEqual({ email: 'a@b.co' });
  });

  it('rejects a missing email', () => {
    expect(authForgotPasswordSchema.safeParse({}).success).toBe(false);
  });
});

describe('authResetPasswordSchema', () => {
  const valid = { email: 'a@b.co', otp: '123456', new_password: 'newpassword1' };

  it('accepts email, OTP and a compliant new password', () => {
    expect(authResetPasswordSchema.parse(valid)).toEqual({
      email: 'a@b.co',
      otp: '123456',
      new_password: 'newpassword1',
    });
  });

  it('rejects a weak new password', () => {
    expect(authResetPasswordSchema.safeParse({ ...valid, new_password: 'weak' }).success).toBe(false);
  });

  it('rejects a bad OTP', () => {
    expect(authResetPasswordSchema.safeParse({ ...valid, otp: '12' }).success).toBe(false);
  });
});

describe('authTwoFactorCodeSchema', () => {
  it('accepts a 6-digit code', () => {
    expect(authTwoFactorCodeSchema.parse({ code: '123456' })).toEqual({ code: '123456' });
  });

  it('accepts a 10-char recovery code', () => {
    expect(authTwoFactorCodeSchema.parse({ code: 'ABCDEFGH29' })).toEqual({ code: 'ABCDEFGH29' });
  });

  it('rejects empty and out-of-range codes', () => {
    expect(authTwoFactorCodeSchema.safeParse({ code: '' }).success).toBe(false);
    expect(authTwoFactorCodeSchema.safeParse({ code: 'ABCDEFGHIJK' }).success).toBe(false);
  });
});
