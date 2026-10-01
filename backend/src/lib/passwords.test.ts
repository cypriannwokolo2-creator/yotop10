import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './passwords';

describe('passwords', () => {
  it('hashes a password into a bcrypt digest', async () => {
    const hash = await hashPassword('hunter2password');
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain('hunter2password');
  });

  it('verifies the correct password', async () => {
    const hash = await hashPassword('correct horse battery staple1');
    expect(await verifyPassword('correct horse battery staple1', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple1');
    expect(await verifyPassword('wrong password entirely9', hash)).toBe(false);
  });

  it('produces distinct hashes for the same password (per-salt)', async () => {
    const a = await hashPassword('samepassword1');
    const b = await hashPassword('samepassword1');
    expect(a).not.toBe(b);
    expect(await verifyPassword('samepassword1', a)).toBe(true);
    expect(await verifyPassword('samepassword1', b)).toBe(true);
  });
});
