/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // Client-side: always use relative URL with Next.js rewrite proxy
  return '/api';
}

/**
 * Fetch wrapper with dynamic base URL
 * Auth priority: session token > fingerprint (fallback for legacy)
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const headers: any = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (typeof window !== 'undefined') {
    // Prefer session token (secure, expiring, revocable)
    const sessionToken = localStorage.getItem('yotop10_session');
    if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }

    // Also send fingerprint as fallback (for /auth/session endpoint and legacy)
    const deviceFingerprint = localStorage.getItem('yotop10_fp');
    if (deviceFingerprint) {
      headers['X-Device-Fingerprint'] = deviceFingerprint;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[apiFetch] Error response:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// API Response Types
export interface CategoriesResponse {
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  post_count: number;
  is_featured: boolean;
  children: ChildCategory[];
}

export interface ChildCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image_url?: string;
  post_count: number;
}

export interface SingleCategoryResponse {
  category: Category;
}

export interface PostsResponse {
  posts: Post[];
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
  };
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  post_type: string;
  intro: string;
  comment_count: number;
  view_count: number;
  author_username: string;
  author_display_name: string;
  category: Category;
  created_at: string;
}

export interface PostHistoryResponse {
  versions: PostVersion[];
}

export interface PostVersion {
  version_number: number;
  title: string;
  intro: string;
  items: Array<{ rank: number; title: string; justification: string }>;
  created_at: string;
  author_username: string;
  change_summary?: string;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

export interface Comment {
  id: string;
  content: string;
  depth: number;
  fire_count: number;
  reply_count: number;
  spark_score: number;
  author_username: string;
  author_display_name: string;
  created_at: string;
  updated_at?: string;
  list_item_id?: string;
  parent_comment_id?: string;
  replies?: Comment[];
}

// Auth / Identity types
export interface UserIdentity {
  username: string;
  display_name?: string;
  trust_level: 'troll' | 'neutral' | 'scholar';
  email_linked: boolean;
  created_at: string;
}

export interface TransferSession {
  session_id: string;
  qr_data: string;        // encoded data for QR code
  expires_at: string;
}

export interface TransferStatus {
  status: 'pending' | 'awaiting_approval' | 'confirmed' | 'expired';
  username?: string;
}

export interface RecoveryResponse {
  message: string;
  success: boolean;
}

export interface DeviceSession {
  session_id: string;
  device_label: string;     // e.g. "Chrome on Windows"
  last_active: string;
  is_current: boolean;
  created_at: string;
}

export interface AuthTokenResponse {
  token: string;
  expires_at: string;
  username: string;
}

// API Endpoints
export const API = {
  getCategories: (): Promise<CategoriesResponse> => apiFetch('/categories'),
  getCategory: (slug: string): Promise<SingleCategoryResponse> => apiFetch(`/categories/${slug}`),
  getPosts: (page?: number | { category?: string; page?: number; limit?: number }): Promise<PostsResponse> => {
    if (typeof page === 'object') {
      const { category, page: p = 1, limit = 20 } = page;
      return apiFetch(`/posts?page=${p}&limit=${limit}${category ? `&category=${category}` : ''}`);
    }
    return apiFetch(`/posts?page=${page || 1}`);
  },
  getTrendingPosts: (page = 1, limit = 20): Promise<PostsResponse> =>
    apiFetch(`/posts?sort=trending&page=${page}&limit=${limit}`),
  getExplorePosts: (limit = 20): Promise<PostsResponse> =>
    apiFetch(`/explore?limit=${limit}`),
  getPost: (idOrSlug: string): Promise<{ post: Post; items: Array<{ id: string; rank: number; title: string; justification: string; image_url?: string; source_url?: string }> }> => 
    apiFetch(`/posts/${idOrSlug}`),
  getPostHistory: (idOrSlug: string): Promise<PostHistoryResponse> => 
    apiFetch(`/posts/${idOrSlug}/history`),
  getComments: (postId: string): Promise<CommentsResponse> => 
    apiFetch(`/posts/${postId}/comments`),
  addComment: (postId: string, content: string, parent_comment_id?: string, list_item_id?: string) => 
    apiFetch(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_comment_id, list_item_id }),
    }),
  toggleReaction: (target_type: 'comment', target_id: string, device_fingerprint: string) => 
    apiFetch('/reactions', {
      method: 'POST',
      body: JSON.stringify({ target_type, target_id, device_fingerprint }),
    }),

  getReactionState: (targets: Array<{ type: string; id: string }>) => 
    apiFetch(`/reactions/state?targets=${encodeURIComponent(JSON.stringify(targets))}`),

  // Search endpoints
  searchPosts: (query: string, page = 1) => 
    apiFetch(`/search?q=${encodeURIComponent(query)}&page=${page}`),
  getSearchSuggestions: (query: string) => 
    apiFetch(`/search/suggestions?q=${encodeURIComponent(query)}`),

  // Listings endpoints
  getListItems: (postId: string) => 
    apiFetch(`/listings/${postId}`),
  addListItem: (postId: string, item: { title: string, justification: string, image_url?: string, source_url?: string }) => 
    apiFetch(`/listings/${postId}`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  // Reviews endpoints
  getReviews: (postId: string) => 
    apiFetch(`/reviews/${postId}`),
  submitReview: (postId: string, rating: number, device_fingerprint: string) => 
    apiFetch(`/reviews/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ rating, device_fingerprint }),
    }),
  
  // User endpoints
  submitPost: (payload: any) => 
    apiFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUser: () => apiFetch('/users/me'),
  updateDisplayName: (display_name: string) => 
    apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ display_name }),
    }),
  getUserProfile: (username: string) => apiFetch(`/users/${username}`),
  getUsernameHistory: () => apiFetch('/users/me/history'),

  // Admin endpoints
  adminLogin: (username: string, password: string) => 
    apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  adminLogout: () => 
    apiFetch('/admin/logout', { method: 'POST' }),

  adminGetMe: () => apiFetch('/admin/me'),
  
  // Notifications
  getNotifications: () => apiFetch('/notifications'),
  markNotificationRead: (id: string) => apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
  clearNotifications: () => apiFetch('/notifications/clear', { method: 'DELETE' }),

  adminGetStats: () => apiFetch('/admin/stats'),
  adminGetPendingPosts: () => apiFetch('/admin/posts/pending'),
  adminApprovePost: (id: string, action: 'approve' | 'reject', reason?: string) =>
    apiFetch(`/admin/posts/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ action, reason })
    }),
  
  adminGetQuickReplies: () => apiFetch('/admin/quick-replies'),
  
  adminCreateQuickReply: (reply: { label: string, message: string }) => 
    apiFetch('/admin/quick-replies', {
      method: 'POST',
      body: JSON.stringify(reply)
    }),
    
  adminDeleteQuickReply: (id: string) => 
    apiFetch(`/admin/quick-replies/${id}`, { method: 'DELETE' }),

  adminSeedQuickReplies: () => 
    apiFetch('/admin/quick-replies/seed', { method: 'POST' }),

  adminEditPost: (id: string, updates: Partial<Post>) =>
    apiFetch(`/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  
  adminDeletePost: (id: string) =>
    apiFetch(`/admin/posts/${id}`, { method: 'DELETE' }),

  adminGetSettings: () => apiFetch('/admin/settings'),

  adminUpdateSettings: (settings: any) =>
    apiFetch('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
  
  adminUploadImage: async (file: File): Promise<{ url: string, relativeUrl: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    // Cannot use apiFetch directly because body is FormData, which browser natively sets boundaries for
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  adminSetup: (token: string, username: string, password: string) => 
    apiFetch('/admin/setup', {
      method: 'POST',
      body: JSON.stringify({ token, username, password }),
    }),

  adminValidateSetupToken: (token: string) => 
    apiFetch(`/admin/setup/validate?token=${token}`),

  // Auth / Session endpoints
  // Step 1: Exchange fingerprint for a session token (called on first user action, NOT on page load)
  authenticateFingerprint: (device_fingerprint: string, device_label: string): Promise<AuthTokenResponse> =>
    apiFetch('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ device_fingerprint, device_label }),
    }),

  // Refresh session token before expiry
  refreshSession: (): Promise<AuthTokenResponse> =>
    apiFetch('/auth/session/refresh', { method: 'POST' }),


  // QR Transfer endpoints
  initiateTransfer: (): Promise<TransferSession> =>
    apiFetch('/auth/transfer/initiate', { method: 'POST' }),

  approveTransfer: (session_id: string): Promise<RecoveryResponse> =>
    apiFetch('/auth/transfer/approve', {
      method: 'POST',
      body: JSON.stringify({ session_id }),
    }),

  confirmTransfer: (session_id: string): Promise<AuthTokenResponse & { success: boolean; message?: string }> =>
    apiFetch('/auth/transfer/confirm', {
      method: 'POST',
      body: JSON.stringify({ session_id }),
    }),

  getTransferStatus: (session_id: string): Promise<TransferStatus> =>
    apiFetch(`/auth/transfer/status/${session_id}`),

  // Device / Session management
  getActiveSessions: (): Promise<{ sessions: DeviceSession[] }> =>
    apiFetch('/auth/sessions'),

  revokeSession: (session_id: string): Promise<RecoveryResponse> =>
    apiFetch(`/auth/sessions/${session_id}`, { method: 'DELETE' }),

  revokeAllOtherSessions: (): Promise<RecoveryResponse> =>
    apiFetch('/auth/sessions/revoke-others', { method: 'POST' }),

  // Recovery endpoints
  generateRecoveryKey: (): Promise<{ recovery_key: string }> => 
    apiFetch('/auth/recovery/generate', { method: 'POST' }),
    
  claimAccount: (recovery_key: string): Promise<AuthTokenResponse & { success: boolean }> => 
    apiFetch('/auth/recovery/claim', {
      method: 'POST',
      body: JSON.stringify({ recovery_key }),
    }),
};
