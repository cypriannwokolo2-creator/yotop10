'use client';

import { getFingerprint } from './fingerprint';
import { API, type AuthTokenResponse } from './api';

const SESSION_KEY = 'yotop10_session';
const SESSION_EXPIRY_KEY = 'yotop10_session_exp';

/**
 * Auth Manager — Lazy Identity System
 * 
 * Flow:
 * 1. User browses freely — NO fingerprint, NO identity
 * 2. User takes action (comment, react, post) → ensureAuthenticated() is called
 * 3. Fingerprint is generated → exchanged for a session token
 * 4. Session token stored in localStorage, sent via Authorization header
 * 5. Session token expires in 30 days, auto-refreshed
 * 
 * Security:
 * - Raw fingerprint is ONLY sent once to /auth/session to get a token
 * - All subsequent requests use Bearer token (revocable, expiring)
 * - Each device has its own session, user can revoke any
 */

/** Check if user has an active session (without triggering auth) */
export function hasSession(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem(SESSION_KEY);
  const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!token || !expiry) return false;
  return new Date(expiry) > new Date();
}

/** Get current session token (or null) */
export function getSessionToken(): string | null {
  if (!hasSession()) return null;
  return localStorage.getItem(SESSION_KEY);
}

/** Get a human-readable device label for session tracking */
function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  let os = 'Unknown';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

/** Store session token and expiry */
function storeSession(data: AuthTokenResponse) {
  localStorage.setItem(SESSION_KEY, data.token);
  localStorage.setItem(SESSION_EXPIRY_KEY, data.expires_at);
}

/** Clear session (sign out on this device) */
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

/**
 * Ensure user is authenticated before taking an action.
 * Call this BEFORE any write operation (comment, react, post, etc.)
 * 
 * - If session exists and is valid → returns true immediately
 * - If no session → generates fingerprint, exchanges for token
 * - Stores session token for future requests
 */
export async function ensureAuthenticated(): Promise<boolean> {
  // Already have a valid session
  if (hasSession()) return true;

  try {
    // Generate fingerprint (lazy — first time only)
    const fingerprint = await getFingerprint();
    const deviceLabel = getDeviceLabel();

    // Exchange fingerprint for session token
    const data = await API.authenticateFingerprint(fingerprint, deviceLabel);
    storeSession(data);
    return true;
  } catch (err) {
    console.error('[auth] Failed to authenticate:', err);
    return false;
  }
}

/**
 * Store a session from recovery or transfer flows.
 * Called after email recovery verify or QR transfer confirm.
 */
export function storeRecoveredSession(data: AuthTokenResponse) {
  storeSession(data);
}

/**
 * Sign out of THIS device only.
 * Revokes the session on the backend (so the JWT becomes invalid everywhere)
 * then clears local storage.
 */
export async function signOutThisDevice() {
  try {
    // Revoke on backend first — this makes the JWT useless even if someone copied it
    await API.signOutThisDevice();
  } catch {
    // Session may already be revoked — continue with local cleanup
  }
  clearSession();
  localStorage.removeItem('yotop10_fp');
}

/**
 * Sign out of ALL other devices (keep current session).
 * Requires backend call to revoke all other sessions.
 */
export async function signOutOtherDevices(): Promise<boolean> {
  try {
    const res = await API.revokeAllOtherSessions();
    return res.success;
  } catch {
    return false;
  }
}
