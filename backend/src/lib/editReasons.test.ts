import { describe, it, expect } from 'vitest';
import { EDIT_REASONS, MAX_EDIT_REASON_LENGTH, normalizeEditReason, isValidEditReason } from './editReasons';

describe('editReasons', () => {
  it('ships a non-empty preset list', () => {
    expect(EDIT_REASONS.length).toBeGreaterThan(0);
    for (const r of EDIT_REASONS) expect(typeof r).toBe('string');
  });

  it('accepts presets and custom text', () => {
    expect(normalizeEditReason('Fixed factual error')).toBe('Fixed factual error');
    expect(normalizeEditReason('  Custom reason with  extra   spaces  ')).toBe('Custom reason with extra spaces');
  });

  it('rejects empty, non-string, and over-long reasons', () => {
    expect(normalizeEditReason('')).toBeNull();
    expect(normalizeEditReason('   ')).toBeNull();
    expect(normalizeEditReason(undefined)).toBeNull();
    expect(normalizeEditReason(null)).toBeNull();
    expect(normalizeEditReason(42)).toBeNull();
    expect(normalizeEditReason('x'.repeat(MAX_EDIT_REASON_LENGTH + 1))).toBeNull();
    expect(normalizeEditReason('x'.repeat(MAX_EDIT_REASON_LENGTH))).not.toBeNull();
  });

  it('isValidEditReason mirrors normalizeEditReason', () => {
    expect(isValidEditReason('Added missing sources')).toBe(true);
    expect(isValidEditReason('')).toBe(false);
  });
});
