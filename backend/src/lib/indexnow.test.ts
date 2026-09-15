import { describe, it, expect } from 'vitest';
import { indexNowEnabled, postUrlForSlug, articleUrlForSlug, indexNowKeyFileName } from './indexnow';

describe('indexnow', () => {
  it('builds canonical post and article URLs from SITE_URL', () => {
    expect(postUrlForSlug('my-list-abc123')).toMatch(/^https?:\/\/.+\/my-list-abc123$/);
    expect(articleUrlForSlug('my-article-def456')).toMatch(/^https?:\/\/.+\/articles\/my-article-def456$/);
  });

  it('is disabled without INDEXNOW_API_KEY', () => {
    const prev = process.env.INDEXNOW_API_KEY;
    delete process.env.INDEXNOW_API_KEY;
    expect(indexNowEnabled()).toBe(false);
    expect(indexNowKeyFileName()).toBeNull();
    if (prev !== undefined) process.env.INDEXNOW_API_KEY = prev;
  });

  it('is enabled with a valid key and exposes the key file name', () => {
    const prev = process.env.INDEXNOW_API_KEY;
    process.env.INDEXNOW_API_KEY = 'abc123def456';
    expect(indexNowEnabled()).toBe(true);
    expect(indexNowKeyFileName()).toBe('abc123def456.txt');
    if (prev !== undefined) process.env.INDEXNOW_API_KEY = prev;
    else delete process.env.INDEXNOW_API_KEY;
  });

  it('rejects keys shorter than 8 chars', () => {
    const prev = process.env.INDEXNOW_API_KEY;
    process.env.INDEXNOW_API_KEY = 'short';
    expect(indexNowEnabled()).toBe(false);
    if (prev !== undefined) process.env.INDEXNOW_API_KEY = prev;
    else delete process.env.INDEXNOW_API_KEY;
  });
});
