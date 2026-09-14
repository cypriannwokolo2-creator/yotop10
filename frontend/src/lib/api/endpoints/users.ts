import { apiFetch } from '../client';

export const usersApi = {
  getCurrentUser: () => apiFetch('/users/me'),

  initIdentity: (challenge_id: string, nonce: string) =>
    apiFetch<{ user_id: string; username: string; custom_display_name: string | null; trust_score: number; created_at?: string }>('/users/init', {
      method: 'POST',
      body: JSON.stringify({ challenge_id, nonce }),
    }),

  getChallenge: () =>
    apiFetch<{ challenge_id: string; difficulty: number }>('/users/challenge'),

  updateDisplayName: (display_name: string) =>
    apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ display_name }),
    }),

  updateProfileImage: (url: string) =>
    apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ profile_image_url: url }),
    }),

  updateBio: (bio: string) =>
    apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ bio }),
    }),

  updateLinks: (links: { medium?: string; x?: string; github?: string }) =>
    apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ links }),
    }),

  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/upload/profile', {
      method: 'POST',
      body: formData,
      headers: {},  // Let browser set multipart boundary
    });
  },

  getUserProfile: (username: string) => apiFetch(`/users/${username}`),

  getUsernameHistory: () => apiFetch('/users/me/history'),
};
