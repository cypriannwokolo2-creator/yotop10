/**
 * View-counting guards — decides whether a detail fetch represents a REAL human view.
 *
 * Counted OUT (returns false):
 * - Internal/metadata fetches flagged with `X-No-Count` (SEO metadata, OG images, history pages)
 * - Prerender/prefetch traffic (Next Link prefetch, `Sec-Purpose`/`Purpose: prefetch`)
 * - Bots, crawlers and link-preview scrapers (by User-Agent)
 */
import { Request } from 'express';

const BOT_UA =
  /bot|crawler|spider|crawl|slurp|mediapartners|baidu|yandex|duckduck|sogou|exabot|facebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|embedly|quora|pinterest|redditbot|applebot|bingpreview|google-structured|chrome-lighthouse|lighthouse|headless|phantomjs|selenium|playwright|puppeteer|curl|wget|libwww|httpclient|postmanruntime|insomnia|httpie|python-requests|python-urllib|java\/|axios|node-fetch|undici/i;

function headerValue(req: Request, name: string): string {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] || '' : v || '';
}

export function isPrefetch(req: Request): boolean {
  const secPurpose = headerValue(req, 'sec-purpose').toLowerCase();
  const purpose = headerValue(req, 'purpose').toLowerCase();
  const nextPrefetch = headerValue(req, 'next-router-prefetch');
  return (
    secPurpose.includes('prefetch') ||
    secPurpose.includes('prerender') ||
    purpose.includes('prefetch') ||
    purpose.includes('prerender') ||
    nextPrefetch === '1'
  );
}

export function isBot(req: Request): boolean {
  const ua = headerValue(req, 'user-agent');
  if (!ua) return true; // no UA at all is never a real browser view
  return BOT_UA.test(ua);
}

export function shouldCountView(req: Request): boolean {
  if (headerValue(req, 'x-no-count')) return false;
  if (isPrefetch(req)) return false;
  if (isBot(req)) return false;
  return true;
}
