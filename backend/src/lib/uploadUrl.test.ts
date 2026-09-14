import { describe, it, expect } from 'vitest';
import { isAcceptedImageUrl } from './uploadUrl';

describe('isAcceptedImageUrl', () => {
  it('accepts site-relative upload paths', () => {
    expect(isAcceptedImageUrl('/uploads/3d926abaef00d9ec44b98728dcd84be6_1200x675.webp')).toBe(true);
    expect(isAcceptedImageUrl('/uploads/abc123_profile.webp')).toBe(true);
  });

  it('accepts full http(s) URLs', () => {
    expect(isAcceptedImageUrl('https://example.com/cover.jpg')).toBe(true);
    expect(isAcceptedImageUrl('http://example.com/a.png')).toBe(true);
  });

  it('treats empty as absent (optional fields)', () => {
    expect(isAcceptedImageUrl('')).toBe(true);
    expect(isAcceptedImageUrl(undefined)).toBe(true);
  });

  it('rejects junk and wrong schemes', () => {
    expect(isAcceptedImageUrl('not a url')).toBe(false);
    expect(isAcceptedImageUrl('ftp://example.com/a.jpg')).toBe(false);
    expect(isAcceptedImageUrl('javascript:alert(1)')).toBe(false);
    expect(isAcceptedImageUrl('/etc/passwd')).toBe(false);
    expect(isAcceptedImageUrl('/uploads/../../etc/passwd')).toBe(false);
    expect(isAcceptedImageUrl(42)).toBe(false);
  });
});
