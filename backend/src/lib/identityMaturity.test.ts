import { describe, it, expect } from 'vitest';
import { isIdentityMature } from './identityMaturity';

const DAY = 24 * 3600 * 1000;

describe('identityMaturity', () => {
  it('matures by age (7+ days), regardless of trust', () => {
    expect(isIdentityMature(new Date(Date.now() - 8 * DAY), 0.7)).toBe(true);
    expect(isIdentityMature(new Date(Date.now() - 30 * DAY), 0.1)).toBe(true);
  });

  it('matures early by trust (>= 1.0)', () => {
    expect(isIdentityMature(new Date(), 1.0)).toBe(true);
    expect(isIdentityMature(new Date(), 1.8)).toBe(true);
  });

  it('holds back the young and untrusted', () => {
    expect(isIdentityMature(new Date(), 0.7)).toBe(false);
    expect(isIdentityMature(new Date(Date.now() - 6 * DAY), 0.9)).toBe(false);
    expect(isIdentityMature('not-a-date', 0.5)).toBe(false);
    expect(isIdentityMature(new Date(), undefined)).toBe(false);
  });
});
