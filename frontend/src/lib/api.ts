/**
 * API Base URL utility
 * Uses INTERNAL_API_URL on server-side (for SSR/SSG)
 * Uses NEXT_PUBLIC_API_URL on client-side (for browser fetches)
 */

// Export for direct use in components
export function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use internal URL for Docker network
    return process.env.INTERNAL_API_URL || 'http://localhost:8000/api';
  }
  // Client-side: use public URL for external access
  return process.env.NEXT_PUBLIC_API_URL || 'https://yotop10.fun/api';
}

/**
 * Fetch wrapper with dynamic base URL
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * API endpoints
 */
export const API = {
  // Categories
  getCategories: () => apiFetch('/categories'),
  getCategory: (slug: string) => apiFetch(`/categories/${slug}`),

  // Posts
  getPosts: (params?: { category?: string; page?: number; limit?: number }) => {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiFetch(`/posts${query}`);
  },
  getPost: (id: string) => apiFetch(`/posts/${id}`),
  getPostHistory: (id: string) => apiFetch(`/posts/${id}/history`),

  // Reactions
  getReactionState: (postId: string) => apiFetch(`/reactions/state?post_id=${postId}`),
  toggleReaction: (postId: string) => apiFetch('/reactions', {
    method: 'POST',
    body: JSON.stringify({ post_id: postId }),
  }),

  // Comments
  getComments: (postId: string) => apiFetch(`/comments?post_id=${postId}`),
  addComment: (postId: string, content: string) => apiFetch('/comments', {
    method: 'POST',
    body: JSON.stringify({ post_id: postId, content }),
  }),
};