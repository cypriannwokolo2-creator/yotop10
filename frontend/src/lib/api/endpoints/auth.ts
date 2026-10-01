import { apiFetch } from '../client';

export interface AuthUser {
  user_id: string;
  username: string;
  custom_display_name: string | null;
  profile_image_url: string | null;
  bio: string;
  links: { medium?: string; x?: string; github?: string };
  trust_score: number;
  trust_level: 'newbie' | 'ghost' | 'troll' | 'neutral' | 'scholar';
  post_count: number;
  comment_count: number;
  posts_approved: number;
  posts_rejected: number;
  created_at?: string;
  first_seen_at?: string;
}

export interface LoginResponse {
  success: true;
  user?: AuthUser;
  requires_otp?: true;
}

export const authApi = {
  register: (email: string, password: string, username: string) =>
    apiFetch<{ success: true; expires_in: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  registerVerify: (email: string, otp: string, password: string, username: string) =>
    apiFetch<{ success: true; user: AuthUser }>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp, password, username }),
    }),

  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginVerify: (email: string, otp: string) =>
    apiFetch<{ success: true; user: AuthUser }>('/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  login2fa: (code: string) =>
    apiFetch<{ success: true; user: AuthUser }>('/auth/login/2fa', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  logout: () =>
    apiFetch<{ success: true }>('/auth/logout', { method: 'POST' }),

  getMe: () => apiFetch<AuthUser>('/auth/me'),

  forgotPassword: (email: string) =>
    apiFetch<{ success: true }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, new_password: string) =>
    apiFetch<{ success: true }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password }),
    }),

  twoFactorSetup: () =>
    apiFetch<{ secret_uri: string; recovery_codes: string[] }>('/auth/2fa/setup'),

  twoFactorEnable: (code: string) =>
    apiFetch<{ success: true; enabled: true }>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  twoFactorDisable: (code: string) =>
    apiFetch<{ success: true; enabled: false }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  twoFactorRecovery: (code: string) =>
    apiFetch<{ success: true; recovery_codes: string[] }>('/auth/2fa/recovery', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
};
