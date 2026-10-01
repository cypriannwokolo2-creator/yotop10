export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_INTERNAL_API_URL || 'http://backend:8000/api';
  }
  return '/api';
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 3;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  // Session identity rides on the httpOnly session_token cookie
  // (credentials: 'include'); guest identity on the guest_id cookie.
  // No device-fingerprint headers — the fingerprint system is removed.

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers, credentials: 'include' });
  } catch (err) {
    // Network error (ECONNREFUSED, DNS failure, etc.) — backend unreachable
    throw new Error(`API Network Error: ${url} - ${(err as Error).message}`);
  }

  if (response.status === 425) {
    // Do not retry FormData (upload) — body stream may be consumed, and grace retry would create churn
    if (isFormData) {
      const t = await response.text().catch(() => '');
      throw new Error(`API Error: 425 Too Early - ${t}`);
    }
    if (retryCount >= MAX_RETRIES) {
      throw new Error(`API Error: 425 Too Early - Max retries (${MAX_RETRIES}) exceeded`);
    }
    await new Promise(r => setTimeout(r, 500));
    return apiFetch(endpoint, options, retryCount + 1);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error(`API Error: Empty response body from ${url}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`API Error: Invalid JSON response from ${url}`);
  }
}
