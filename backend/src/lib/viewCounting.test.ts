import { describe, it, expect } from 'vitest';
import { shouldCountView, isBot, isPrefetch } from './viewCounting';
import type { Request } from 'express';

const reqWith = (headers: Record<string, string>): Request =>
  ({ headers } as unknown as Request);

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

describe('viewCounting', () => {
  it('counts a plain browser open', () => {
    expect(shouldCountView(reqWith({ 'user-agent': BROWSER_UA }))).toBe(true);
  });

  it('skips internal metadata fetches flagged with X-No-Count', () => {
    expect(shouldCountView(reqWith({ 'user-agent': BROWSER_UA, 'x-no-count': '1' }))).toBe(false);
  });

  it('skips prefetch and prerender traffic', () => {
    expect(isPrefetch(reqWith({ 'sec-purpose': 'prefetch' }))).toBe(true);
    expect(isPrefetch(reqWith({ purpose: 'prefetch' }))).toBe(true);
    expect(isPrefetch(reqWith({ 'next-router-prefetch': '1' }))).toBe(true);
    expect(shouldCountView(reqWith({ 'user-agent': BROWSER_UA, 'sec-purpose': 'prefetch' }))).toBe(false);
  });

  it('skips bots, crawlers and link-preview scrapers', () => {
    expect(isBot(reqWith({ 'user-agent': 'Googlebot/2.1' }))).toBe(true);
    expect(isBot(reqWith({ 'user-agent': 'Slackbot-LinkExpanding 1.0' }))).toBe(true);
    expect(isBot(reqWith({ 'user-agent': '' }))).toBe(true);
    expect(isBot(reqWith({ 'user-agent': 'curl/8.5.0' }))).toBe(true);
    expect(isBot(reqWith({ 'user-agent': 'undici' }))).toBe(true);
    expect(isBot(reqWith({ 'user-agent': BROWSER_UA }))).toBe(false);
    expect(shouldCountView(reqWith({ 'user-agent': 'Twitterbot/1.0' }))).toBe(false);
  });
});
