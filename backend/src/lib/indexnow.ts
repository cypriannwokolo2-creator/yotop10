const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.yotop10.com').trim();
  return raw.replace(/\/+$/, '');
}

function getApiKey(): string | null {
  const key = (process.env.INDEXNOW_API_KEY || '').trim();
  return key.length >= 8 ? key : null;
}

export function indexNowKeyFileName(): string | null {
  const key = getApiKey();
  return key ? `${key}.txt` : null;
}

export function indexNowEnabled(): boolean {
  return getApiKey() !== null;
}

async function postIndexNow(payload: Record<string, unknown>): Promise<boolean> {
  const key = getApiKey();
  if (!key) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[IndexNow] submission rejected: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('[IndexNow] submission failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

export async function submitUrlsToIndexNow(urls: string[]): Promise<boolean> {
  const key = getApiKey();
  if (!key) return false;
  const siteUrl = getSiteUrl();
  const host = siteUrl.replace(/^https?:\/\//, '');
  const clean = [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(0, 10000);
  if (clean.length === 0) return false;
  return postIndexNow({
    host,
    key,
    keyLocation: `${siteUrl}/${key}.txt`,
    urlList: clean,
  });
}

export function submitUrlToIndexNow(url: string): void {
  void submitUrlsToIndexNow([url]);
}

export function postUrlForSlug(slug: string): string {
  return `${getSiteUrl()}/${slug}`;
}

export function articleUrlForSlug(slug: string): string {
  return `${getSiteUrl()}/articles/${slug}`;
}
