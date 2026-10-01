# M41 — Real Authentication System (Email/Password + OTP)

> **Status**: DESIGN — awaiting Go for M41.1
> **Date**: 2026-10-01
> **Replaces**: The anonymous fingerprint-identity system (M11/M15) in full.

---

## 1. Goal

Replace the anonymous-only identity system (device-fingerprint minting,
proof-of-work bootstrap, crypto seed identities) with a real email/password
auth system, while keeping the platform browsable and lightly interactive
for anonymous visitors.

### User decisions (locked in)

| # | Decision |
|---|----------|
| 1 | OTP verification at **registration** and **forgot-password**. **New-device login** requires email OTP after password (password-only on a trusted device). **2FA settings** in /settings with recovery-key generation. |
| 2 | Auth modal offers a **guest path**: guests may comment and fire with rate limits + low-visibility comments. Submitting posts and arguing require login. |
| 3 | **Brevo** is the email provider (API key provided by owner, stored in `BREVO_API_KEY`). |
| 4 | Existing anonymous posts are mock data → a **gradual removal job** deletes them over time; admin composes the real content. |
| 5 | Crypto identity system (seed phrases, device linking, /claim, merge dialogs) — **removed entirely**. |
| 6 | Session = **httpOnly cookie JWT** (same pattern as the admin `admin_token` cookie). |

---

## 2. Architecture

```
Browser ──> Next.js (frontend) ──> Express (backend)
   │                                   │
   │  session_token (httpOnly JWT)     │  userAuthMiddleware:
   │  device_key   (httpOnly, opt-in)  │  verify JWT → req.user
   │  guest_id     (httpOnly, anon)    │  guest cookie → req.guest_id
   │                                   │
   │  OTP via Brevo (api.brevo.com)    │  OTP + send-rate in Redis (TTL)
```

- **Three cookies**, all httpOnly + sameSite=strict:
  - `session_token` — JWT (7 days). The identity.
  - `device_key` — random 32-byte id set at login when "trust this device"
    is checked; its SHA-256 hash is stored on the user. Presentation of a
    matching hash skips the login OTP.
  - `guest_id` — random id for anonymous interactions (rate limits,
    guest comment attribution, fire tracking). Never mints a user record.

- **Legacy anonymous users** (e.g. `a_xxxx_xxxx` accounts) stay in the DB
  flagged `legacy_anonymous: true`. Their old content remains until the
  cleanup job removes it. They cannot log in (no password/email) and are
  excluded from new interactions.

---

## 3. Data model changes (`backend/src/models/User.ts`)

Added fields:

| Field | Type | Notes |
|-------|------|-------|
| `email` | String, unique sparse, lowercase, trimmed | Validated; 409 if taken |
| `password_hash` | String | bcryptjs, 12 rounds (matches admin convention) |
| `email_verified_at` | Date | Set when registration OTP is verified |
| `token_version` | Number, default 0 | Bumped on password change/logout-all → kills JWTs |
| `trusted_devices` | `[{ id_hash: String, created_at: Date, last_seen_at: Date }]` | SHA-256 of `device_key` cookie value |
| `two_factor` | `{ enabled: Boolean, secret: String, recovery_codes_hash: [String] }` | TOTP secret encrypted at rest (AES-256-GCM with JWT_SECRET-derived key); recovery codes stored hashed |
| `legacy_anonymous` | Boolean, default false | Marks pre-M41 fingerprint accounts |

Removed from schema (indexes dropped by startup migration):
`device_fingerprint` (unique idx), `device_fingerprint_aliases`,
`authority_id`, `public_key_hash`, `seed_generated_at`.

New index: `{ email: 1 }` (unique, sparse — legacy users have no email).

**Startup migration** (`backend/src/lib/migrations/userAuth.ts`, idempotent,
runs at boot): drops the `device_fingerprint_1` unique index if present,
creates the sparse unique email index, sets `legacy_anonymous: true` on all
existing users lacking `email`.

---

## 4. API contract (all under `/api/auth`)

Request bodies validated with Zod schemas in `backend/src/schemas/auth.ts`
(defensive-schema rule). All responses JSON.

### 4.1 `POST /api/auth/register` — public
Body: `{ email, password, username }` (email RFC-valid, password ≥8 chars
with letter+number, username 3–32 `^[a-z0-9_]+$`).
- Validates uniqueness of email + username (409 `EMAIL_TAKEN` / `USERNAME_TAKEN`)
- Rate limit: 5/hour/IP, 3/hour/email
- Generates 6-digit OTP (10-min TTL, 5 attempts), stores registration
  payload in Redis `reg:{email}` (20-min TTL), sends Brevo email
- Returns `{ success: true, expires_in: 600 }` (never reveals whether email exists)

### 4.2 `POST /api/auth/register/verify` — public
Body: `{ email, otp, password, username }`
- Verifies OTP (purpose `register`), creates User
  (`trust_score: 1.0`, `email_verified_at`, `legacy_anonymous: false`)
- Issues session cookie + `device_key` (trusted automatically — it is the
  device that just verified the email)
- Returns `{ success: true, user: {…me shape} }`

### 4.3 `POST /api/auth/login` — public
Body: `{ email, password }`
- bcrypt compare; **5 failed attempts → 15-min lock** (mirrors admin)
- If `two_factor.enabled` → requires TOTP next step (401 `TWO_FA_REQUIRED`)
- Else if `device_key` cookie hashes to a known trusted device → session
  immediately (200)
- Else → send login OTP (10-min TTL), respond `{ requires_otp: true }`
- Returns `{ success: true, user }` or `{ requires_otp: true }`

### 4.4 `POST /api/auth/login/verify` — public
Body: `{ email, otp, trust_device?: boolean }`
- Verifies login OTP → issues session; if `trust_device`, sets `device_key`
  cookie + stores hash in `trusted_devices`
- Returns `{ success: true, user }`

### 4.5 `POST /api/auth/login/2fa` — public
Body: `{ email, code }` (TOTP, ±1 step window)
- After password step with 2FA enabled. On success behaves like 4.3's
  device-trust branch (trusted device → session; else email OTP).

### 4.6 `POST /api/auth/forgot-password` — public
Body: `{ email }`
- Always 200 (no account enumeration). Sends reset OTP if account exists.
- Rate limit: 3/hour/IP, 1/hour/email

### 4.7 `POST /api/auth/reset-password` — public
Body: `{ email, otp, new_password }`
- Verifies reset OTP → updates `password_hash`, bumps `token_version`
  (kills all sessions), clears `trusted_devices`

### 4.8 `POST /api/auth/logout` — auth (session cookie)
- Clears `session_token` cookie, bumps `token_version` (kills other sessions
  of the same token family — deliberate: one logout = logout everywhere is
  safer default; document in UI as "Log out everywhere"? → No: only clears
  current session cookie server-side; token_version bump optional.
  **Decision**: bump token_version — simple, secure, matches admin behavior.)

### 4.9 `GET /api/auth/me` — auth
- Returns the current user context (same shape as old `/api/users/me`).
- 401 when logged out. `/api/users/me` becomes an alias (same handler) so
  existing frontend call sites keep working during migration.

### 4.10 2FA management — auth (session)
- `GET /api/auth/2fa/setup` → `{ secret_uri: otpauth://…, recovery_codes: […] }`
  (codes shown ONCE; stored hashed)
- `POST /api/auth/2fa/enable` body `{ code }` — verifies one TOTP, flips
  `two_factor.enabled`
- `POST /api/auth/2fa/disable` body `{ code }`
- `POST /api/auth/2fa/recovery` body `{ code }` — regenerate recovery codes
- Recovery codes are single-use fallbacks when the authenticator is lost.

### Error cases (summary)
| Case | Status | Code |
|------|--------|------|
| Validation failure | 400 | `VALIDATION` + field messages |
| Email/username taken | 409 | `EMAIL_TAKEN` / `USERNAME_TAKEN` |
| Bad credentials | 401 | `INVALID_CREDENTIALS` |
| Locked out | 429 | `ACCOUNT_LOCKED` (+ reset time) |
| OTP wrong/expired | 400 | `OTP_INVALID` / `OTP_EXPIRED` |
| Too many OTP attempts | 429 | `OTP_ATTEMPTS_EXCEEDED` |
| Not logged in | 401 | `UNAUTHORIZED` |
| 2FA required | 401 | `TWO_FA_REQUIRED` |
| Brevo not configured | 503 | `EMAIL_UNAVAILABLE` (log-only mode sends nothing) |

---

## 5. OTP + Brevo internals

`backend/src/lib/otp.ts`:
- 6-digit code via `crypto.randomInt(0, 999999)` (zero-padded)
- Redis keys: `otp:{purpose}:{email}` → `{ code_hash, attempts, expires }`
  TTL 600s; `otp:send:{email}` and `otp:send:ip:{ip}` send-rate keys
- `verifyOtp()` compares SHA-256 of provided code (constant-time),
  increments attempts, 5 strikes → 15-min lockout key

`backend/src/lib/brevo.ts`:
- `sendOtpEmail(email, code, purpose)` → `fetch('https://api.brevo.com/v3/smtp/email')`
  with `api-key: BREVO_API_KEY`, template payload
  `{ sender: {name:'YoTop10',email:'noreply@yotop10.com'}, to:[{email}], subject, htmlContent }`
- If `BREVO_API_KEY` unset → **log-only mode**: log the code server-side
  (development) and return `true`. Never throw — auth stays testable.

---

## 6. TOTP (2FA)

`backend/src/lib/totp.ts` — RFC 6238, HMAC-SHA1, 30s step, 6 digits,
implemented with Node `crypto` (no new dependency). ±1 step verification
window. Secret: 20 random bytes, base32-encoded for otpauth URI; stored
AES-256-GCM-encrypted with a key derived from `JWT_SECRET`.
Recovery codes: 10 × 10-char random, bcrypt-hashed, single-use.

---

## 7. Guest system (no account)

- `guest_id` cookie (32-byte random, 1-year TTL) set on any request
  lacking it; attached as `req.guest_id`.
- **Comments**: `POST /api/posts/:idOrSlug/comments` accepts EITHER
  session user OR `{ guest_name, guest_id }`. Guest comments stored with
  `is_guest: true`, `guest_name` (3–32 chars), `low_visibility: true`,
  `guest_fingerprint_key: guest_id` for rate limiting.
  Guest rate limit: **5 comments/hour** (vs 20×trust for users).
  Low visibility = rendered collapsed with a "Show guest comment" affordance
  + Guest badge; not hidden from the page, just de-emphasized.
- **Reactions (fire)**: guests allowed; `POST /api/reactions` accepts
  `guest_id` when no session. Guest fire rate limit: 20/hour.
  Guest fire state tracked by `guest_id` (not user).
- **Everything else** (submit post/article, arguments, bookmarks, votes):
  requires session → 401 → frontend opens the auth modal.
- **Per-comment engagement**: fire counts live on the comment document
  (`fire_count`) and never increment the post's own counters — already the
  case; preserved and extended to guest fires.

---

## 8. Removal list (backend)

| What | Where |
|------|-------|
| Fingerprint middleware (minting, grace, PoW bootstrap) | `middleware/fingerprint.ts` → replaced by `middleware/userAuth.ts` + guest cookie helper |
| PoW bootstrap endpoints | `users.ts` `/init`, `/challenge` |
| Identity routes (seed, claim, link, devices) | `routes/identity.ts` + registration in `index.ts` |
| Fingerprint merge routes | `routes/fingerprintMerge.ts` |
| Fingerprint submit route | `routes/fingerprint.ts` |
| Identity libs | `lib/identityCrypto.ts`, `lib/identityMaturity.ts`, `lib/fingerprintMatching.ts`, `lib/proofOfWork.ts` (+ tests) |
| Models | `models/AuthChallenge.ts`, `models/UserDevice.ts` |
| User schema fields | see §3 (indexes dropped by migration) |
| `createUserForFingerprint` callers | comment/vote paths reworked to session-or-guest |

Keep: `getClientIp`, Redis, rate-limit helpers, `logAudit`.

---

## 9. Gradual anonymous-post cleanup (`M41.3`)

`backend/src/lib/anonCleanupCron.ts`, registered in `server.ts` via
`cronRegistry` (hourly, idempotent, single-server lock via Redis):
- Each run: delete up to `anon_cleanup_batch_size` (SystemConfig, default
  10) **oldest** approved posts authored by `legacy_anonymous` users
  (re-home their comments to nothing — cascade delete via existing delete
  path), then up to 100 orphaned comments by legacy-anon authors on
  remaining posts.
- Audit-logged (`anon_cleanup` action) with counts; job self-stops when
  zero legacy posts remain (logs "legacy cleanup complete").
- Rationale (owner decision): existing posts are mock data; the admin will
  compose real content, so the platform transitions to real content without
  a big-bang deletion.

---

## 10. Frontend design (`M41.4` / `M41.5`)

### 10.1 Auth store (`frontend/src/stores/auth.ts` rewrite)
- State: `user | null`, `initialized`, `fetchUser()` (GET /auth/me,
  single-flight), `logout()`. No PoW, no fingerprint, no auto-mint.
- Login/register/verify/forgot/reset are plain API calls; components read
  `user` from the store.

### 10.2 Auth modal (`frontend/src/components/AuthModal.tsx`)
- **Lazy-loaded**: `const AuthModal = dynamic(() => import('./AuthModal'), { ssr: false })`
  — zero impact on first-load JS (per requirement).
- Mounted once from `AuthModalProvider` (client wrapper in layout) backed by
  `stores/authModal.ts` (zustand: `open`, `mode`, `pendingAction`, `openModal(mode, action?)`).
- **Step flow with horizontal slide transitions** (translateX + fade):
  1. **Credentials** — email + password; toggle "Log in" / "Create account"
     (register adds username + confirm-password); links: "Forgot password?",
     "Continue as guest".
  2. **OTP** — 6-digit code input (paste-friendly single input), resend with
     60s countdown, "Back" link, attempts feedback.
  3. **Forgot password** — email → OTP → new password (3 screens, same slide).
  4. **Guest** — "Continue as guest" closes the modal and runs the pending
     action with guest rights (only for comment/fire; otherwise hidden).
- On successful auth: `useAuthStore.fetchUser()` refresh, toast, then
  `pendingAction()` runs (the comment submit / fire the user originally
  attempted).

### 10.3 Gating (`frontend/src/hooks/useRequireAuth.ts`)
```ts
const { requireAuth } = useRequireAuth();
const onSubmit = () => requireAuth(() => submitComment(text), { guest: true });
// guest: true → modal shows "Continue as guest"; false → auth mandatory
```
Wired into: comment submit, FireButton, post/article submit, arguments,
bookmark save, votes.

### 10.4 Comment form guest mode
When `user === null` and guest mode chosen: name input (3–32 chars,
localStorage `yotop10_guest_name` remembered), "Your comment appears as a
guest and may be collapsed" hint.

### 10.5 New pages
- `/login`, `/register`, `/forgot-password` — full-page versions of the
  same flows (server-rendered shells, client forms), linked from the modal
  ("Continue in new tab" not needed — same components).

### 10.6 Removal list (frontend)
`lib/proofOfWork.ts` (+test), `lib/fingerprint.ts`, `lib/bip39Wordlist.ts`,
`lib/identity.ts`, `components/AuthInitializer.tsx` (rewritten to session
bootstrap), `SeedDisplayModal.tsx`, `SecureMyAuthority.tsx`,
`FingerprintMergeDialog.tsx`, `app/claim/`, settings identity sections,
DynamicIsland identity-retry logic, `/api/users/init|challenge` callers.

### 10.7 2FA settings (`/settings` → Security section)
Enable (shows QR URI + recovery codes once, download/copy), disable,
regenerate recovery codes. Calls §4.10 endpoints.

---

## 11. Security checklist

- bcryptjs 12 rounds (matches admin convention); password strength ≥8 + letter + number
- OTPs: 6 digits, 10-min TTL, 5 attempts, constant-time compare, send-rate limited per email + IP
- No account enumeration: register/forgot always respond identically for unknown emails
- JWT: 7-day expiry, httpOnly, sameSite=strict, secure in prod; token_version invalidation
- Login lockout 5 attempts / 15 min
- TOTP secret encrypted at rest; recovery codes hashed + single-use
- All writes audit-logged (register, login, password change, 2FA change, logout)
- Zod validation on every auth request body (no express-validator on new routes)

## 12. Milestone breakdown (checkpoint after each)

| Sub | Scope | Gates |
|-----|-------|-------|
| M41.1 | Backend auth core: schemas, otp, brevo, totp, passwords, userAuth lib, userAuth middleware, User model + migration, `/api/auth/*` routes | tsc, lint, build, new unit tests |
| M41.2 | Backend removal: fingerprint middleware removal, route deletions, comment + reaction guest paths, `/api/users/me` alias | tsc, lint, build, backend tests |
| M41.3 | Anon cleanup cron + SystemConfig knob | tsc, lint, tests |
| M41.4 | Frontend: auth store, AuthModal (lazy, slides), authModal store, useRequireAuth, gating wiring, guest comment name prompt | tsc, lint, build |
| M41.5 | Frontend removal: delete anon-identity UI/pages, add /login /register /forgot-password pages, 2FA settings | tsc, lint, build |
| M41.6 | Final gates, live verification, docs sync (product_spec, milestones, ram, rom) | all AGENTS.md gates |

## 13. Open items for the owner

1. **Brevo API key** — paste it so it can be added to `backend/.env`
   (gitignored; never committed). Until then the sender runs log-only.
2. Defaults assumed (veto anytime): OTP 6 digits / 10 min / 5 attempts;
   session 7 days; guest comment limit 5/hour; cleanup 10 posts/hour.
3. Register asks for a **username** (profile URLs are `/a/[username]`).
