import { describe, it, expect } from 'vitest';
import { hasLeadingZeroBits, solvePowChallenge } from './proofOfWork';

describe('proofOfWork', () => {
  it('checks leading zero bits', () => {
    expect(hasLeadingZeroBits(new Uint8Array([0, 0, 1]), 16)).toBe(true);
    expect(hasLeadingZeroBits(new Uint8Array([0, 0, 1]), 23)).toBe(true);
    expect(hasLeadingZeroBits(new Uint8Array([0, 0, 1]), 24)).toBe(false);
    expect(hasLeadingZeroBits(new Uint8Array([0b00011111]), 3)).toBe(true);
    expect(hasLeadingZeroBits(new Uint8Array([0b00111111]), 3)).toBe(false);
    expect(hasLeadingZeroBits(new Uint8Array([255]), 1)).toBe(false);
  });

  it('solves a tiny challenge', async () => {
    const nonce = await solvePowChallenge('test-seed', 4);
    expect(/^\d+$/.test(nonce)).toBe(true);
  }, 15000);
});
