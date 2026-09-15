import { describe, it, expect } from 'vitest';
import { isDeniedFingerprint, isLowEntropyFingerprint } from './fingerprint';

describe('isDeniedFingerprint', () => {
  it('drops values in the explicit denylist', () => {
    expect(isDeniedFingerprint('000000000f6f92bf')).toBe(true);
    expect(isDeniedFingerprint('00000000695088c4')).toBe(true);
  });

  it('does not drop legit grace-generated 32-char hex', () => {
    expect(isDeniedFingerprint('adf1533a371b7c528b031e79ce61e812')).toBe(false);
    expect(isDeniedFingerprint('ebd94b05773266e969de4b94d8346b15')).toBe(false);
    expect(isDeniedFingerprint('16ce7c4fee0b27282910bb7570558b20')).toBe(false);
  });

  it('returns false for undefined and empty input', () => {
    expect(isDeniedFingerprint(undefined)).toBe(false);
    expect(isDeniedFingerprint('')).toBe(false);
  });
});

describe('isLowEntropyFingerprint', () => {
  it('flags 6+ leading zeros (script hand-set pattern)', () => {
    expect(isLowEntropyFingerprint('000000000f6f92bf')).toBe(true);
    expect(isLowEntropyFingerprint('00000000695088c4')).toBe(true);
    expect(isLowEntropyFingerprint('0000000000000000')).toBe(true);
    expect(isLowEntropyFingerprint('000000')).toBe(true);
  });

  it('does NOT flag legit grace-generated fingerprints', () => {
    expect(isLowEntropyFingerprint('adf1533a371b7c528b031e79ce61e812')).toBe(false);
    expect(isLowEntropyFingerprint('ebd94b05773266e969de4b94d8346b15')).toBe(false);
    expect(isLowEntropyFingerprint('16ce7c4fee0b27282910bb7570558b20')).toBe(false);
    expect(isLowEntropyFingerprint('0ce6930b3d4938877a1c52d37a3277724981a104ee555c6b75fe83580503d2be')).toBe(false);
  });

  it('does not flag fewer than 6 leading zeros', () => {
    expect(isLowEntropyFingerprint('00000abc1234')).toBe(false);
    expect(isLowEntropyFingerprint('0a1b2c3d4e5f')).toBe(false);
    expect(isLowEntropyFingerprint('1234567890ab')).toBe(false);
  });

  it('is case-insensitive on hex chars', () => {
    expect(isLowEntropyFingerprint('000000ABCDEF12')).toBe(true);
  });
});