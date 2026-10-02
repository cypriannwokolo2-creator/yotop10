# RAM.md — Random Access Memory: Current Task State

> **Last updated**: 2026-10-02
> **Working tree**: clean — [M41.7] committed and pushed to cocor (see git log for hash)
> **Branch**: main
> **Latest commits**: `[M41.7]` (this commit), `773f0892 [M42]`, `5497a9b5 [M42]`

---

## ✅ COMPLETED: M41 — Real Authentication System (2026-10-01 → 2026-10-02)

**Status**: M41.1–M41.6 all shipped; all CI gates green. Design doc + completion record: `docs/plans-auth-m41.md` (§14).

**Shipped**: email/password + OTP (registration, new-device login, forgot-password), trusted devices (password-only on trusted device), optional 2FA (TOTP + recovery codes), httpOnly `session_token` JWT cookie (7-day session, token_version), `guest_id` cookie for anonymous interactions (comment 5/hr low-visibility with guest name 3–32 chars, fire 20/hr). The fingerprint/crypto-seed identity system (M11/M15) was removed in full. Legacy `a_XXXX` accounts flagged `legacy_anonymous`; their mock posts are gradually removed by the M41.3 cleanup cron (10/hour) while admin composes real content.

**Open (owner)**: paste `BREVO_API_KEY` into `backend/.env` (gitignored, never committed) — until then the sender runs log-only mode and OTP codes appear in backend logs. Full register→OTP→login live pass requires the key.

**Commits**: `f79eb959`/`f78e2f3c` [M41.1], `69910136` [M41.2], `4acb52b4` [M41.3], `6fe947f7` [M41.4–M41.5], + docs-sync commit (this one).

---

## Current Health

| Check | Status |
|-------|--------|
| Backend typecheck (`tsc --noEmit`) | ✅ 0 errors |
| Frontend typecheck (`tsc --noEmit`) | ✅ 0 errors |
| Backend lint | ✅ 0 errors, 0 warnings |
| Frontend lint | ✅ 0 errors, 0 warnings |
| Backend build (`tsc`) | ✅ 0 errors |
| Frontend build (`next build`) | ✅ Completed (build + postbuild manifest generation injected BUILD_ID) |
| Backend tests (vitest) | ✅ 774 passed, 4 skipped (53 files) |
| Frontend tests (vitest) | ✅ 96 passed (12 files) |

---

## What Has Been Done

### Recent commits (top of main):
1. **[M41.4–M41.5]** Frontend real-auth UI (lazy AuthModal with slide steps, authModal store, useRequireAuth gating, 2FA settings page) + crypto-identity removal in full
2. **[M41.3]** Gradual anon-post cleanup cron (SystemConfig `anon_cleanup_batch_size`, default 10/hour)
3. **[M41.2]** Backend removal: fingerprint middleware + identity routes out, session+guest identity in
4. **[M41.1]** Backend auth core: Zod schemas, OTP, Brevo sender, TOTP, passwords, userAuth lib/middleware, User model + migration, `/api/auth/*` routes
5. **[M00.8]** Lower nav hide breakpoint to 980px, uncomment DynamicIsland hydration fix
2. **[M00.7]** Remove faulty SW, fix responsive nav with plain CSS, comment out bottom nav
3. **Clean up** stale docs, dead env vars, and AI artifacts
4. **Update** product_spec.md to reflect current state
5. **Disable** Next.js dev indicators
6. **Remove** Eruda + FloatingDock + hamburger; add User icon in top bar
7. **Add** loading skeletons (FeedSkeleton on 5 CSR pages, AdminTableSkeleton)
8. **Fix** ghost posts — filter deleted posts from public feed + post detail
9. **Fix** admin auth immunity — Next.js middleware.ts (Edge, cookie only, zero API calls)
10. **Admin SSR** — convert admin auth from client-side to server-side rendering
11. **Admin mobile responsiveness** — 12 admin pages mobile-audit, AdminSlideMenu
12. **Moderator System (M17)** — 31 permissions, 4 presets, 8 CRUD endpoints, 3-layer enforcement
13. **Post cards v2/v3** — UI polish (numbered circles, author byline, carousel)
14. **Various fixes** — theme flash, hydration, fonts, bottom nav, slide menu

### Milestones completed (all checked ✅):
M1 (Foundation), M2 (Schema), M3 (Submit), M4 (Feed), M5 (Post Detail), M6 (Categories), M7 (Comments), M9 (Admin Auth), M10 (Admin Dashboard), M11 (User System), M12 (Search), M13 (Arguments), M14 (Hall of Fame), M15 (Identity — removed in M41), M17 (Moderator System), **M41 (Real Authentication System)**

### ROM issues resolved ✅ (17 of 19):
Hardcoded JWT, orphaned setInterval, $regex injection, stub 200s, health check ordering, dynamic import on approval, module-level cron, 'unknown' fingerprint, Redis singleton, route barrel export, localStorage crashes, 425 infinite recursion, XSS in JSON-LD, Eruda safety guards, atomic rate limits (2.7), display-name rename race (2.8), non-null assertion after findById (2.10)

---

## What Remains Open

### Still open ROM issues (2 marked ⏳):
| # | Issue | Notes |
|---|-------|-------|
| 1.9 | MongoDB replica set for transactions | `withTransaction()` crashes on standalone |
| 1.10 | Orphaned comments on deletion | Grandchildren may be orphaned |

### Unfinished features:
- **M41 follow-up (owner)** — paste `BREVO_API_KEY` into `backend/.env`; then live-verify register→OTP→login end to end
- **M5.6** — Counter-List System (The Arena): challenge/rebuttal, comparison engine, SEO governance
- **M10.7** — Categories Management frontend: tree view, drag-drop, bulk ops, analytics
- **M10.14** — Admin UI components: StatsChart, CategoryTree, UserBadge, SearchInput, DateRangePicker, ExportButton, ConfirmDialog
- **V2.x** — Post changelog/revisions, email notifications, design themes
- **Deployment** — "Deployed and verified" unchecked
- **V1 MVP** — "Deployed and verified" unchecked

### Code quality items (from ROM):
- `any` escapes in fingerprint.ts, rate limit type mismatch, AudioContext leak, hash & hash no-op, magical category count formula

---

## Next Steps (Priority Suggestion)

1. **Lock in stability** — Fix 2 remaining ROM issues (crash/data integrity)
2. **Complete admin UI** — Categories tree view, remaining components
3. **Build the Arena** — M5.6 Counter-List System (major feature)
4. **Deploy & verify** — Production deployment
5. **Post-MVP** — V2 features, theming, notifications

---

## Latest Verification

- **M41.7 (2026-10-02) — Display-name rename race closed (ROM 2.8)**: the TOCTOU between reading and writing `custom_display_name` can no longer lose silently. Unique sparse indexes on `custom_display_name` and `short_username` (`models/User.ts`) make same-handle renames an atomic single-winner contest at the DB level; the boot migration (`lib/migrations/userAuth.ts`) drops+recreates both indexes idempotently (pre-scans for duplicates, skips with a warning if any exist — pre-fix scan found 0). `routes/users.ts` catches E11000 → 409 "Display name already taken"; `lib/userAuth.ts` `createAuthUser()` retries on E11000 with a fresh 4-hex suffix (≤5 attempts) so simultaneous registrations can never collide. Live end-to-end: register→OTP→verify→rename all 200; concurrent race test — two simultaneous PATCHes to 'racetest' → A=200 (`a_racetest`), B=409 (exactly one winner). Gates: backend typecheck ✅ lint ✅ build ✅ tests **774 passed | 4 skipped**; frontend typecheck ✅ lint ✅ build ✅ (frontend gates run on the host — `Dockerfile.dev` never ships `.eslintrc.json`, so `pnpm lint` inside the container cannot resolve the project config).
- **M42 (2026-10-02) — Logo = favicon**: the favicon IS the main logo, so every
  logo surface now renders its exact mark. OG-image `LogoMark`
  (`lib/seo/ogImageLayout.tsx`) rebuilt from a 3-bar approximation
  (`[46,64,30]`, h9, r5, `#e8492b`) to the favicon's measured 5-bar geometry
  (40-grid rendered 1:1 px: top-2 bars 15.55w short, bottom-3 21.95w wide,
  all right-aligned, r ≈ 0.22×h, fill `#d24924` sampled from `icon-512.png`);
  `LIGHT.bar` → `#d24924` (also the RankRow default accent). App `Logo.tsx`
  bar values corrected to the measured extents (wide bars x=8.52/w=21.95,
  right edge 30.47 — was 8.44/22.11; heights 5.94/6.02/6.64/6.8/7.11).
  `public/generate-icons.sh` rewritten — it generated an orange 'Y' letter that
  never matched the shipped favicon; now draws the real 5-bar mark and derives
  the full favicon set. Gates: frontend typecheck ✅ lint ✅ (0/0) build ✅.
- **M41 completion (2026-10-01/02)** — real authentication system shipped across 5 commits
  (`f79eb959`→`6fe947f7`): backend `/api/auth/*` (register/verify, login/verify/2fa,
  forgot/reset-password, logout, me, 2FA setup/enable/disable/recovery), session = httpOnly
  `session_token` JWT (7-day, token_version), guest = `guest_id` cookie (comment 5/hr
  low-visibility, fire 20/hr), fingerprint/crypto-identity subsystem deleted in full
  (middleware, identity routes, AuthChallenge/UserDevice models, PoW/bip39/fingerprint libs,
  `/claim` page, SeedDisplayModal, SecureMyAuthority, FingerprintMergeDialog). Gates at
  commit `6fe947f7`: backend typecheck ✅ lint ✅ build ✅ tests **774 passed | 4 skipped**
  (53 files); frontend typecheck ✅ lint ✅ 0/0 build ✅ tests **96 passed** (12 files).
  M41.5 deviation: dedicated /login /register /forgot-password pages consolidated into the
  lazy AuthModal slide steps (modal-first UX per locked decision). Docs synced: milestones,
  not-implemented, product_spec, rom, ram + plans-auth-m41 §14 completion record.
  **Owner follow-up**: paste `BREVO_API_KEY` into `backend/.env` (log-only until then).
- **Abuse response (M20.1–M20.3, 2026-09-14)** — bot flood (19 accounts/24h in pairs, zero-cluster
  fp collisions, 36-second handle squat) met with: simple math challenge + per-IP rate limits on
  identity creation; middleware read-only on bootstrap paths (it was minting before the route's
  challenge ran — caught live, fixed, re-verified 400/403/200); cookie-round-trip gate (428) on
  rename/seed-key/device-link/merge-confirm; SHA-256 client fingerprint hash; fp aliases with
  rotation of the exposed nabbed identity (seamless via alias); cross-user-only demotion with audit
  receipts. DB surgery: 20 bot + 11 test accounts removed (zero content each, verified first),
  3 ghost-authored seed posts re-homed, admin password rotated + sessions killed (old pw 401s).
  Users: exactly 3 legit remain. Admin password rotated + sessions killed (old pw 401s).
  Follow-up M20.4: refused to merge the "stranger" account (its fingerprint is a hand-set bot
  value looping re-mints — merging would have armed it with the cutie identity); deleted it and
  denied the value instead (403 on mint, grace-heal on reads). Backend typecheck ✅ lint ✅
  tests ✅ 674 passed.
- **Loop-breaker (M21, 2026-09-14)** — the math question cost scripts nothing (one more bot
  account appeared mid-session and solved it). Replaced with proof-of-effort: 20-bit SHA-256
  puzzle, ~1-3s silent compute per new device, ~3.4M hashes verified live per mint. Minting now
  requires the issued cookie (one-shot scripts: 428); wrong/empty solutions 403/400. Renames and
  seed keys frozen for young untrusted accounts (7 days or trust ≥ 1.0). Live verified end to
  end, test accounts removed (3 legit users remain). Backend ✅ 678 tests pass. Frontend
  typecheck ✅ lint ✅ **build ✅ EXIT 0, zero errors** (1 pre-existing hall-of-fame test fail,
  untouched). Frontend PoW solver + stale share-button tests fixed alongside.
- **Re-link (2026-09-14)** — the "new user every visit" loop was the owner's own browser: its
  stable cookie survived each cleanup, so the 425 auto-mint silently re-minted after every
  deletion (same cookie behind a_222a and a_eadd). Deleted a_eadd (zero content), aliased the
  owner's cookie to cutie, verified live that the cookie now resolves to cutie (user_id
  54f39ac86e1f07ab, bio + posts intact). No bot-farm activity in logs — flood is over.
- **M22 fixes (2026-09-14)** — rename 403 was the maturity lock firing on the stranger account
  (young + untrusted), correct behavior; rename form now shows the server's real reason instead
  of a generic failure. Missing seed images regenerated locally (gradient covers, exact
  filenames) — all 4 serve 200. Bio placeholder rewritten to invite a real bio. Frontend
  typecheck ✅ lint ✅ build ✅ EXIT 0.
- **M22.1 (2026-09-14)** — seed posts use the standard imageless background (DB refs nulled,
  generated covers removed — no fake art). Bot still trickling (~1/min, PoW-bound): 3 more
  removed, mint limits tightened to 5/hr/IP, their rename attempts blocked by the maturity lock
  (the 403s in logs are the bot's, not the owner's — cutie is mature and exempt). Rename form
  now surfaces validation messages too.
- **M23 pending articles (2026-09-14)** — admin had zero article moderation (articles sat in
  pending_review with no UI and no API). Added: Article rejection_reason, article notification
  types, articles:read/approve permissions (catalog, map, presets), 7 admin endpoints
  (list/detail/approve/reject/cancel/bulk), full review UI (queue + detail) + sidebar entry.
  Verified live with admin session; 1 flood-debris article waiting in the queue for the owner.
  Backend 682 tests ✅, frontend build ✅ EXIT 0.
- **M22.2 (2026-09-14)** — article/list-image validators demanded absolute URLs while the
  uploader returns site-relative paths (every uploaded cover 400'd). Shared `uploadUrl`
  validator + tests, used by both routes; verified live with the reporter's exact file
  (400 → 401 fail-closed on auth, validation clean; file itself serves 200). Note: dev
  backend needed a manual pm2 restart — tsx watch did not pick up the change. Frontend typecheck ✅ lint ✅ **build ✅ EXIT 0, zero errors**.
- **Profile hydration (M18.6)** — `/a/cutie` hydration mismatch traced to a STALE cached app-page
  chunk in the browser (old `md:hidden` mobile-wrapper bundle hydrating fresh server HTML; the served
  chunk and server HTML were verified fresh and matching). Immediate fix for the viewer: hard refresh.
  Hardening committed: owner-only upgrade (`isOwn`, auth `trustScore`) applies after mount, so SSR HTML
  and first client render always agree. Frontend typecheck ✅ lint ✅ build ✅.
- **One-brain identity (M15.1)** — `backend/src/middleware/fingerprint.ts` rewritten: cookie is the
  single authoritative identity, `X-Device-Fingerprint` header is a recovery hint only (adopted when
  the cookie names nobody but the header names a known user). Reads NEVER mint users — anonymous
  requests flow through without `req.user`. Single creation site `createUserForFingerprint()` used by
  write paths + new `POST /api/users/init` (explicit bootstrap; ignores grace-fresh fingerprints,
  425s without client identity). Duplicate `declare module 'express'` block removed — sole `Request`
  extension is `backend/src/types/express.d.ts`. Fixed pre-existing unused `customShortForNew` in users.ts.
- **Real views (M5.7)** — new `backend/src/lib/viewCounting.ts` (`shouldCountView`: skips `X-No-Count`,
  prefetch/prerender, bots/crawlers/scrapers incl. curl/undici/empty-UA). Post + article detail skip
  increment for non-real fetches and author self-views. `POST /api/explore/view` locked: 400/401/404 +
  per-identity hourly dedup, returns `{counted}`. Frontend: `getPost/getArticle(..., {noCount})` used by
  all metadata/OG/history server fetches; ShareButton no longer tracks modal-open (copy-only in ShareModal).
- **Single-flight frontend** — `AuthInitializer` (no more 4s poll) + `useAuthStore.fetchUser` share one
  in-flight resolution; 425 triggers one explicit `POST /init`, then load. Logout claims via `/init`.
- **Live verified on yotop10.com (dev stack)**: post detail 200, curl views frozen (2→2), `/init` 425
  without identity / 200 with header, `/explore/view` 400 on empty body. Smoke-test users removed from DB.
- Backend typecheck ✅, frontend typecheck ✅, backend lint ✅ 0/0, frontend lint ✅,
  backend build ✅, frontend build ✅ EXIT=0, backend tests ✅ 671 passed (667 + 4 new viewCounting)

### Previous verification notes (kept for history)

- **Removed** faulty service worker entirely (13 files deleted) — SW was serving stale cached HTML, no CSS fix could overcome it
- **Replaced** all Tailwind responsive display utilities with plain CSS classes (`.hide-desktop`, `.show-desktop`, `.show-from-sm`, `.show-from-sm-block`) outside Tailwind's `@layer` to guarantee cascade wins
- **Fixed** hydration instability: removed empty `<Suspense>` wrapper around `<DynamicIsland>` that caused React to remount and strip className attributes
- **Lowered** `.hide-desktop`/`.show-desktop` breakpoint from 1024px to 980px to match Chrome Android "Request Desktop Site" viewport behavior
- **Committed and pushed** to `origin/main` — commits `7aa16346 [M00.7]` and `7958e402 [M00.8]`
- Frontend typecheck ✅, lint ✅ (0 errors), build compiled ✅, 32/32 static pages generated ✅

### Production deploy + relink (2026-09-15)
- **Host cutover**: fresh server, restore `yotop10-db.archive` via `mongorestore --drop` → 5 users / 24 posts / 5 articles / 341 categories (matches source). Archive shredded post-restore.
- **uploads_data**: `backend/uploads/` (22 files) copied into the named volume before backend start.
- **nginx.conf bug fix**: production upstreams corrected (`yotop10_dev` → `frontend`/`backend`) — was a copy-paste from dev compose; nginx was crashing with `host not found in upstream` until fixed.
- **Real TLS**: certbot `certonly --webroot` issued Let's Encrypt cert for `yotop10.com` + `www.yotop10.com`, expires 2026-12-14, YR1 issuer. Init-nginx.sh auto-detected, no self-signed fallback. Auto-renew installed by certbot.
- **`.env` + Dockerfile.frontend + docker-compose.yml**: converted hardcoded `NEXT_PUBLIC_*` to build args sourced from `.env`. www is now canonical, apex 301s → www. CORS allows both apex and www.
- **Relink on cutover (per docs/relink.md)**:
  - `/a/3a54` (a_3a54_037b) → **gojominitia**: full procedure. Fingerprint `0ce6930b3d4938877a1c52d37a3277724981a104ee555c6b75fe83580503d2be` aliased to user `cbd41aeb6627d62a`. Proved live: `/api/users/me` with the old fp returns gojominitia, server re-binds cookie to canonical `ebd94b05...`.
  - `/a/40b0` (a_40b0_4b3a) → **cutiee**: refused per safety check 2. Fingerprint `00000000695088c4` was 16 chars (not 32) and matched `isLowEntropyFingerprint()` (6 leading zeros), same family as the existing denied value `000000000f6f92bf` and cutiee's existing alias `000000000f6f`. **Same scenario as M20.4** (cutiee relink refused for the same reason). Stranger deleted, value NOT aliased.
- **Denylist extended**: added `00000000695088c4` to `DENIED_FINGERPRINTS` (`backend/src/middleware/fingerprint.ts:50`). Live test: `curl -b 'device_fingerprint=00000000695088c4' /api/users/me` → 425 with `Set-Cookie: device_fingerprint=16ce7c4fee0b27282910bb7570558b20` (fresh 32-char grace-heal). No mint.
- **Auto-reject low-entropy fingerprints**: wired `isLowEntropyFingerprint()` into `fingerprintMiddleware` so any value matching `/^0{6,}[0-9a-f]*$/i` is dropped to undefined the same way `DENIED_FINGERPRINTS` entries are. The grace generator produces 32-char random hex at ~1 in 16M for 6 leading zeros, so any match is hand-set by a script. New unit tests cover denylist + low-entropy helpers (`backend/src/middleware/fingerprint.test.ts`). Live verified: `00000000deadbeef` (not in the explicit set, just structurally bot-like) → 425 + fresh grace-heal. Grace generator output (`16ce7c4fee0b27282910bb7570558b20`) and 5-leading-zero strings (below threshold) pass through unchanged.
- **Backend typecheck ✅, lint ✅ (0/0), build ✅, 689 tests passed (4 skipped; +7 from the new fingerprint.test.ts)**. Frontend typecheck/lint/build ✅. Backend rebuilt + restarted; uploads_data volume preserved.

### SEO + OG platform overhaul (2026-09-15, [M24.1]–[M24.5])
- **Bug A (P0)**: `GET /api/posts/:idOrSlug` omitted `slug` from the `post` object while the list/counter/edit endpoints all included it. Every post page rendered `canonical` + `og:url` as `https://www.yotop10.com/undefined`. Fixed in `backend/src/routes/posts.ts:471`. Frontend now also uses `params.slug` (defense in depth).
- **Bug B (P0)**: `frontend/src/app/layout.tsx:53` hardcoded `openGraph.url: "https://yotop10.com"` (apex). Now env-driven (`NEXT_PUBLIC_SITE_URL`), structured og:image object with width/height/alt/type.
- **OG generators rewritten** (`[slug]/opengraph-image.tsx`, `articles/[slug]/opengraph-image.tsx`): previous versions used Satori-incompatible CSS (`display: -webkit-box`, `WebkitLineClamp`, `system-ui`/`monospace` fonts Satori cannot load), no `alt`, no immutable cache headers, per-request font I/O. New versions: Geist Sans/Mono TTF loaded once at module scope (`lib/seo/ogFonts.ts`), shared Satori-safe JSX primitives (`lib/seo/ogImageLayout.tsx`), `export const alt`, `runtime = 'nodejs'`, `Cache-Control: public, immutable, no-transform, max-age=31536000`.
- **New OG routes**: `app/opengraph-image.tsx` (homepage, live top-6 titles), `app/a/[username]/opengraph-image.tsx` (profile card), `app/og/category/route.tsx` (category card — route handler, NOT file convention, because `c/[[...slug]]` is a catch-all and Next.js forbids children after catch-alls; nginx proxies `/api/*` to backend so `/og/*` path used). `twitter-image.tsx` re-exports for homepage/post/article/profile (zero duplication).
- **Metadata standards** (`lib/seo/metadata.ts`): `buildArticleMetadata` / `buildProfileMetadata` / `buildWebsiteMetadata` builders. `og:type` per page (article/profile/website), structured og:image everywhere, `article:{publishedTime,authors,section,tags}`, `twitter:{site,creator,images}`, profile `username/firstName/lastName`. Category page gained `generateMetadata`. Homepage + 10 static pages gained canonical + og:url. Search/saved/notifications/pending marked `noindex`.
- **Article body bug fixed**: `articles/[slug]/page.tsx` was CSR-only (`ArticleDetailClient` fetched in `useEffect`, title rendered "Article Not Found" while metadata succeeded). Refactored to SSR-fetch + `initialArticle` prop, matching the post page pattern.
- **Sitemap cadence**: posts/articles `revalidate` 3600 → 300; categories/profiles stay 3600.
- **IndexNow** (`backend/src/lib/indexnow.ts` + tests): fire-and-forget POST to `api.indexnow.org` on post/article single + bulk approve. Inert without `INDEXNOW_API_KEY` (returns false, warn-log only, never blocks admin response). Key-file name helper for the `{key}.txt` ownership file.
- **Live verified**: post canonical/og:url/og:type/og:image:alt all www-correct; article title + h1 render server-side; all 6 sitemaps + robots 200; all 5 OG routes + category API route return valid 1200×630 PNGs (70–119KB); `Cache-Control: immutable` confirmed; profile og:image uses real avatar photo.
- **Gates**: backend typecheck ✅ lint ✅ build ✅ tests ✅ 693 passed (+4 indexnow); frontend typecheck ✅ lint ✅ build ✅. Commits [M24.0]–[M24.5].

### Device-dependent theme default + light-mode overhaul (2026-09-15, [M25.1])
- **Default**: desktop (≥980px, matches nav breakpoint) → light; mobile + tablet → dark. Stored `yotop10_theme` always wins; toggle writes storage permanently. No OS `prefers-color-scheme` detection (unchanged policy).
- **Infra**: new `frontend/src/lib/theme.ts` (`getPreferredTheme`/`applyTheme`/`persistTheme` + `THEME_INIT_SCRIPT` string constant so the blocking head script and the component can't drift). `layout.tsx` head script now applies stored-or-device default pre-paint + syncs `theme-color` meta; `viewport` uses per-scheme themeColor + `colorScheme: "dark light"`. `ThemeToggle` uses the shared helper.
- **globals.css extension** (~110 rules): solid dark surfaces (`bg-zinc-900` + `/70/80/90/95`, `bg-zinc-800`, `bg-black` page bg — scrims `bg-black/40|50|60` and on-photo badges deliberately untouched), all 9 `text-white/*` variants, `bg-white/15|20|25|30|40|50` + `/[0.06]`, rings (`ring-white/*`, `ring-zinc-700`), `divide-white/5`, `border-white/[0.03]`, gradient stops (`from-zinc-900`, `via-zinc-800`, `to-black`, …), gradient-button `text-white` guard (keeps white on CTAs by specificity), full `hover:`/`placeholder:` variant coverage, accent text darkening (`*-400` → `-700` + accent hover mappings) with same-element `bg-black/50|60` guards so on-photo badges keep bright hues, theme vars (`--color-muted/surface/border`) flip, glass/slab/spatial/wiki/scrollbar light variants, profile hero + trust-knob classes.
- **Component fixes**: profile hero banner + avatar fallback get dedicated light gradients; docs privacy/terms/cookies `bg-black` → `bg-[var(--color-bg)]`; trust slider knob gets `trust-knob` class (dark knob on light track); `new/client` type-picker h3 drops conflicting `text-white` (accent map now drives both modes).
- **Out of scope (deliberate)**: modal scrims + on-photo badges stay dark; OG PNG generators unaffected (not HTML theming); `AdminAlertBell` hardcoded-light inline styles noted as inverse issue for later.
- **Gates**: frontend typecheck ✅ lint ✅ build ✅. Live verified: head script contains `matchMedia('(min-width: 980px)')`, all new selectors present in served CSS, profile page 200, stack all healthy.

### Public loading skeletons + light-for-all + super-admin rotation (2026-09-15, [M26.1]–[M26.2])- **Skeletons (public only, admin excluded per scope)**: new `SearchSkeleton`, `NotificationDetailSkeleton`, `HistorySkeleton` (shared by post + username history) in `frontend/src/components/`, matching existing skeleton conventions (`animate-pulse` + `bg-white/*`, all light-mode covered). Wired into `search/client` (initial results), `notifications/[id]/client`, `[slug]/history/client`, `username-history/client`.
- **Light default for all devices**: `getPreferredTheme()` fallback is now unconditional `'light'`; head script simplified (stored-or-light). `DESKTOP_MIN_WIDTH`/`isDesktopWidth` exports retained as dead code per explicit instruction.
- **Super-admin rotation via sanctioned setup flow**: `adminusers` BSON backup to `/tmp` (since shredded post-verify), minted 15-min setup token, `POST /api/admin/setup` (`AdminUser.deleteMany` + bcrypt-12 create — no manual hash surgery). Verified: new login 200 + `super_admin`, `/api/admin/me` OK, `adminusers` count = 1 (new `_id`, old JWTs dead), token marked used. Temp secrets shredded.
- **Gates**: frontend typecheck ✅ lint ✅ build ✅. Live verified: head script fallback `'light'`, no `matchMedia` remnant, skeleton routes 200, stack all healthy.

### Admin edit overhaul: images, sources, required reasons + author notifications (2026-09-15, [M27.1]–[M27.3])
- **Post edit page** (`admin/posts/[id]/edit`): added hero image (`ImageUploader` reuse), per-item `image_url` + `source_url` fields, and a required reason picker (6 presets + custom ≤500 chars, blocks save until filled). GET `fields=` extended; PATCH body extended.
- **Article edit (new)**: backend `GET /admin/articles/:id` (any status) + `PATCH /admin/articles/:id` (title/body/category/cover/sources, no version lock — Article has no version field), frontend `admin/articles/[id]/edit/` page. **All Articles merged into All Posts**: `/admin/posts` is now tabbed All Content (Posts | Articles) with per-type stats/filters/tables/bulk actions; standalone `/admin/articles` list removed (pending routes + edit page stay).
- **Dropdown light-mode sweep**: last hard-hex `bg-[#0a0a14]` (CustomDropdown) → `bg-zinc-900`; on-image button text guards (`bg-black/60` + `text-white/80`/`hover:text-white` keep white). Verified zero `bg-[#hex]` remain; all other absolute menus already covered or deliberate scrims.
- **Notifications**: new `post_edited` / `article_edited` enum types; backend fires on every edit with the reason in the message; Bell + list + `[id]` detail render them explicitly (Pencil icon, "An admin edited your …", article links route to /articles).
- **Backend**: `lib/editReasons.ts` (presets + normalize/validate, tested), items image/source persisted incl. journal rollback path, audit `edit_post`/`edit_article` now carry `edit_reason`.
- **Live verified with temp super_admin (deleted after)**: PATCH without reason → 400 on both; PATCH with reason → 200 + correct notifications in DB. Test wiped one post's items — reconstructed 10 items + neutral intro via a second PATCH (disclosed).
- **Gates**: backend typecheck ✅ lint ✅ build ✅ tests ✅ 697 passed; frontend typecheck ✅ lint ✅ build ✅.

### Ranking order setting + mobile bell dot (2026-09-15, [M29.1]–[M29.2])
- **Mobile bell**: `DynamicIsland` had its own number badge (the one seen on mobile) → dot, matching the desktop bell fix.
- **`list_order: 'asc'|'desc'`** in `SystemConfig` (default `asc` = today's behavior), plumbed through `DEFAULT_CONFIG`/`leanToShape`/`updateConfig` (+audit) and `configUpdateSchema`; `PUT /admin/config` rejects non-super-admin with 403 (mirrors `double_blind` precedent).
- **Ordering helper** (`lib/listOrder.ts`, tested): `RANKED_LIST_TYPES` = top_list/best_of/worst_of/hidden_gems/counter_list; `orderItemsForDisplay` reverses per post type, no-ops otherwise. Rank numbers stay attached (no renumbering).
- **Public read paths**: posts list top-3 (now top-3 *of display order*), post detail, explore top-3. Untouched: revision history, admin/pending/edit/review paths (canonical ascending), compare diff engine (rank-keyed, order-independent).
- **`/admin/config` page** (super_admin, desktop nav entry): asc/desc radio cards + save; explains scope and countdown semantics.
- **Live verified**: desc → detail 10→1 numbers intact, list/explore show highest ranks first, this_vs_that unchanged [1,2]; invalid value → 400; mod+config:write → 403; reverted to asc → [1..10] restored. Temp verification admins deleted.
- **Gates**: backend typecheck ✅ lint ✅ build ✅ tests ✅ 700 passed; frontend typecheck ✅ lint ✅ (build in deploy step).

### Light OG cards per mockups + real post/article images (2026-09-15, [M30.1]–[M30.2])
- **Assets**: pulled remote `757def5` (user-uploaded `og-image.png` brand card + `og-image (2).png` user template, both 1200×630). Brand PNG converted to JPEG 47KB → replaced `public/og-image.jpg` (was 32KB, now on-brief). Root uploads consumed (kept in git history).
- **All 5 generators rebuilt light**: homepage = brand bars card (matches mockup 1); profile = logo + tier-colored trust pill + `{name} on YoTop10` + live stats + red CTA + avatar disc with real photo or monogram (matches mockup 2); post/article = logo + type badge + title + top items + **real hero/cover photo side panel when present**; category = light + top-3.
- **Two runtime bugs found by live logs and fixed**: (1) Satori multi-text-node div (`{category} · yotop10.com`) threw "explicit display:flex" → single template string; (2) Satori cannot decode WebP (`Unsupported image type`) → generators skip `.webp`/unknown extensions, fall back to text/monogram cards.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors) build ✅. All 5 routes 200 with valid 1200×630 PNGs; visually inspected home/profile/post renders against the mockups.

### OG corrections: exact homepage bytes, CTAs everywhere, profile 200px fix (2026-09-15, [M30.5]–[M30.6])
- **Homepage as-sent**: `app/opengraph-image.png` + `app/twitter-image.png` serve the exact uploaded bytes (321,398B verified). Lesson: static file-convention routes keep their extension (`/opengraph-image.png`); the extensionless URL is code-convention-only and was serving homepage HTML. Homepage meta updated accordingly.
- **CTAs added** (were missing): black "Join the Fun!" on post, article, and category cards.
- **Profile 200×200 fix**: metadata used to prefer the raw avatar URL (200px upload, falsely labeled 1200×630) → validators failed it on X/LinkedIn/WhatsApp/Slack. Now always the generator route (true 1200×630, avatar composited inside). Verified by resolving the tagged URL and reading PNG dims.
- **Post card verified visually**: real title, badge, www domain line, ranked items, CTA, external hotlinked photo renders fine.

### Responsive shell unification (2026-09-29, [M32.1])
- **Nav dead zone 980–1024 closed**: `layout.tsx` wrappers moved from `lg:` (1024px) to `hide-desktop`/`show-desktop` (980px) to match `DynamicIsland`/`SlideMenu`; `main` margin `lg:ml-64` → `min-[980px]:ml-64`; sidebar `lg:translate-x-0`/`lg:w-72` → `min-[980px]:translate-x-0`/`xl:w-72`; minimal topbar `left-64 lg:left-72` → `left-0 min-[980px]:left-64 xl:left-72`.
- **Gates**: frontend typecheck ✅ lint ✅. Pushed to `cocor-tech/yotop10` as `cypriannwokolo2-creator` (history rewritten, `origin` untouched).

### Homepage responsive unification (2026-09-29, [M32.2])
- **Tablet mismatch fixed**: homepage carousel (`lg:`) and content sections (`md:`) now both switch at `min-[980px]`, matching the nav/sidebar breakpoint — no more mobile-carousel + desktop-grid mix on 768–1024px tablets.
- **Carousel widths**: mobile cards `w-[calc(76vw-12px)]` → add `sm:w-[calc(46vw-12px)]` (two-card peek on ≥640px); `FeedClient` adds `min-[980px]:w-[380px]`; card image `h-44 lg:h-64` → `h-44 sm:h-52 lg:h-64`.
- **FAB overlap fixed**: `SubmitFAB` `sm:bottom-6` → `min-[980px]:bottom-6` so it clears the 90px bottom nav on 640–980px tablets.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Committed as `cypriannwokolo2-creator`, pushed to `cocor-tech/yotop10`.

### Sidebar rail toggle + logo + equal cards (2026-09-29, [M32.3])
- **Instagram-style sidebar toggle**: new `stores/sidebar.ts` (zustand, `collapsed` persisted to `localStorage` behind try/catch, SSR-safe default expanded + post-mount hydrate). `DesktopSidebar` collapses to a `w-20` icon rail (monogram logo, icon-only nav/user/CTA, `PanelLeftClose/Open` toggle). New `ContentShell` client wrapper drives `<main>` margin (`min-[980px]:ml-20` vs `ml-64/xl:ml-72`); `DesktopTopBarMinimal` offset follows the same store.
- **Logo everywhere**: compact YO-Top10 brand link added to `DesktopTopBarMinimal` (desktop top bar previously had no brand); rail monogram when collapsed.
- **Equal cards**: `PostCarouselCard` root `h-full` + title `min-h` (2-line reserve) + footer already `mt-auto`; all three carousels (`page`, `FeedClient`, `DesktopCarousel`) `items-stretch` + item `h-full` so row heights match and footers align.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Committed as `cypriannwokolo2-creator`, pushed to `cocor-tech/yotop10`.

### Real brand mark + premium sidebar + theme sync (2026-09-29, [M32.4])
- **Stacked-bars logo**: new `components/Logo.tsx` — vector recreation of the brand mark (5 staggered rounded bars, orange→red gradient, unique gradient id per instance) + `Top10` display wordmark. Swapped out every `YO`-text wordmark: mobile top bar, desktop minimal top bar, sidebar (full lockup expanded, mark-only rail), mobile slide-menu header.
- **Premium sidebar**: `MENU` section caption, active-link left accent bar + inset ring pill, hover slide + press scale, glass user card (`bg-white/[0.03]` + border), refined spacing. No glow effects added (flat borders only).
- **Theme toggle actually fixed**: root cause was per-instance `useState` — sidebar toggle and menu toggle disagreed after one was used. New `stores/theme.ts` (zustand, default `light` matches head script, post-mount hydrate) now drives all `ThemeToggle` instances; toggle persists + applies + syncs everywhere, clearer aria labels.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Committed as `cypriannwokolo2-creator`, pushed to `cocor-tech/yotop10`.

### Logo refinements + production redeploy (2026-09-29, [M32.5]–[M32.8])
- **YO accent wordmark restored** ([M32.5], [M32.7]): bars stay, `YO` back in font-accent gradient + `Top10` display.
- **Matched your fork's bar spec** ([M32.6]): red badge, white right-stepped bars. Then per correction ([M32.8]): solid red bars (`#dc2626`), no badge background, same stacking.
- **Production re-link + redeploy**: DNS `yotop10.com`/`www` → `151.243.3.109` already correct, Let's Encrypt cert present. nginx `unhealthy` root cause was the down `frontend` container (port clash with a host dev server) making `frontend:3000` unresolvable. Fixed: stopped host dev, rebuilt image `2ba7dda82f0e` (latest UI), recreated container. Live verified `https://www.yotop10.com` 200 with new markers (logo ×4, rail toggle ×2, `min-[980px]` ×12, `46vw` ×22). Backend/data untouched.

### Instagram-exact navigation (2026-09-29, [M33.1])
- **Manual collapse removed** (deleted `stores/sidebar.ts`, toggle button, `ContentShell` store wiring): rail state is now purely viewport-driven like Instagram — 72px icon rail at 768–1263px, full 240px labeled sidebar at ≥1264px, bottom tab bar + mobile top bar below 768px.
- **Breakpoint unification**: `globals.css` `.hide-desktop`/`.show-desktop` + bottom-nav padding moved 980px → 768px; homepage sections, `FeedClient` card width, `SubmitFAB` clearance moved `min-[980px]` → `md:` (768px). `ContentShell`/`DesktopTopBarMinimal` use static `md:ml/left-[72px]` + `min-[1264px]:ml/left-60` offsets.
- **Fixed dead profile button**: mobile top-bar profile/bell carried `show-desktop` inside a `hide-desktop` parent, so they never rendered — now always visible.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Committed as `cypriannwokolo2-creator`, pushed to `cocor-tech/yotop10`.

### Hover-rail + Tailwind literal classes (2026-09-29, [M33.2]–[M33.3])
- **Root-caused invisible desktop logos**: breakpoint classes built via `${RAIL}` string interpolation are invisible to Tailwind's scanner, so the CSS was never generated. Rewrote all 17 literally ([M33.2]).
- **Instagram hover-rail** ([M33.3]): rail auto-expands to full width on hover (overlaying content, `group-hover:`), collapses on leave; `overflow-x-hidden` + `whitespace-nowrap` keep short-height/small-width scrolling clean.
- **Click-to-collapse** ([M33.5]): open state moved from pure CSS `group-hover:` to React state — rail still auto-expands on hover, but any click anywhere collapses it (Instagram web behavior). All classes kept literal for the Tailwind scanner; ≥1264px still permanently open via `min-[1264px]:` overrides.
- **Auto-hide at every desktop width** ([M33.7]): the `min-[1264px]:` permanent-open overrides meant wide screens never auto-hid — removed them (sidebar, `ContentShell` margin, `DesktopTopBarMinimal` offset, css comment). Rail is now 72px by default at all ≥768px widths, hover → 240px overlay, click/leave → 72px.
- **Verified with real browser tests** (Playwright/Chromium): `initial=72 hover=240 click=72 away=72 rehover=240` PASS at 1000px, 1600px and 1920px — no more assertions without measurement.

### Premium UI + reading pass (2026-09-29, [M34.1]–[M34.6])
- **Header cleanup** ([M34.1]): profile icon removed from desktop header, duplicate logo removed (brand lives only in the sidebar rail/lockup), search left-aligned with Search icon pill.
- **Card system** ([M34.2]): theme-aware `.card` (dark glass tint + hairline, light white + two-layer soft shadow) and `.card-elevate` (depth without overriding tinted backgrounds) in `globals.css`; light-mode contrast raised for `text-zinc-500/600` (WCAG AA), arbitrary-alpha white borders flipped, blue/sky-300 VS text darkened.
- **List cards** ([M34.3]): premium surface, ringed rank badges, Eye icon in footer, reserved "… more items" row so footers align across equal-height cards.
- **Explore feed** ([M34.4]): all five card variants elevated (neutral cards → `.card`, tinted → `.card-elevate`), meta text bumped 11px→12px with AA colors, tighter tab pills.
- **Article reading** ([M34.5]): editorial serif (`font-serif`/Fraunces) H1 at controlled scale, lead paragraph steps up, body 17–18px/1.8, markdown `##`/`###` headings now render as real headings (they previously showed as literal `##` text) plus `**bold**` inline parsing.
- **Empty states + section headers** ([M34.6]): icon chips with borders, home "Latest Lists" gained a "View all" link, articles list uses `.card` surfaces.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Screenshot-verified light+dark, desktop+mobile via Playwright (header/logo/card/reading confirmed visually). Committed as cypriannwokolo2-creator, pushed to cocor.

### Mobile menu position + notification popup (2026-09-29, [M35.1]–[M35.2])
- **Menu icon on the left** ([M35.1]): mobile top bar now renders `SlideMenuTrigger` before the logo (measured `menu.x=12 < logo.x=60` via Playwright); bell + avatar stay right.
- **Notification popup** ([M35.2]): rounded panel with `overflow-hidden` (corners clip), header row with live unread count + "Mark all read", per-item icon chips (orange when unread), relative timestamps, admin priority pills + tinted backgrounds + dismiss, designed empty state, sticky "See all" footer, `pop-in` entrance animation. Bell button restyled to a round brand-orange badge (was blue box).
- **Gates**: typecheck ✅ lint ✅; popup opened + screenshotted on mobile & desktop (real admin broadcasts rendered).

### Logo-as-menu + perf pass (2026-09-29, [M36.1]–[M36.3])
- **Single menu affordance** ([M36.1]): hamburger removed from mobile top bar; the brand mark is now a button (`aria-label="Open menu"`) that opens the slide menu. Top 2 logo bars slide −6px (staggered 70ms, `cubic-bezier(0.22,1,0.36,1)`) while the menu is open — in both the top bar and the panel logo (`Logo`/`LogoMark` gained `markActive`/`onClick`). Dead `SlideMenu.tsx` trigger deleted.
- **Perf: blur tax removed from fixed/sticky chrome** ([M36.2]): `backdrop-blur` stripped from mobile top bar, desktop minimal header, sidebar (bg now solid `/95`), slide-menu + admin-slide-menu scrims, admin mobile header, sticky profile tabs. Sidebar `transition-all` → `transition-[width]`; nav items → explicit property lists. Rationale: full-width fixed blurs repaint on every scroll frame — the main mobile lag source.
- **Dev-server gotcha**: running `pnpm build` while `next dev -p 3200` is up wipes shared `.next` → all app chunks 404, page loses hydration (looks "dead", no click handlers). Fix: restart dev server after any build. Verified by re-running Playwright after restart.
- **Gates**: frontend typecheck ✅ lint ✅ build ✅ (pre-restart). Playwright (mobile): no hamburger, logo click mounts scrim + panel `translate-x-0`, bar matrix `0 → -6 → 0`, scrim click closes; desktop: visible header has no `backdrop-blur`. Screenshots `/tmp/opencode/menu-open.png`, `menu-closed.png`, `desktop-perf.png`.
- **Incidental**: removed accidentally-committed `test-results/.last-run.json` playwright artifact.

### Mobile nav rework (2026-09-29, [M37.1]–[M37.2])
- **Top bar (<768px)** ([M37.1]): left = `YO Top10` wordmark only (5-bar mark removed via new `Logo showMark={false}`), right = ☰ menu button at far right (right edge 378/390). Bell + profile removed from the header (desktop header keeps its bell — user decision).
- **Sticky footer** (`DynamicIsland`) order now `Home, Search, Arguments, Notifications, Profile` — profile sits RIGHTMOST with retry behavior (pulse when initializing, amber tap-to-retry when identity missing, normal link when signed in). Footer unread poll gated on signed-in (no more 401 chatter every 30s when logged out).
- **Slide menu**: Notifications entry (with unread badge, fetched on menu open) added first, user-gated — desktop bell removal made this the top-bar-less entry point. `Logo` gained `showMark`, lost the now-dead `onClick` button branch.
- **Local dev fix**: host dev server couldn't resolve `backend:8000` (docker alias) → `/api` 500s. Added gitignored `frontend/.env.local` with `INTERNAL_API_URL=http://localhost:8100/api` (backend is published on host port 8100). Gotcha: `pkill -f 'next dev -p 3200'` matches the invoking shell's own command line — use `next de[v]` bracket trick.
- **Gates**: frontend typecheck ✅ lint ✅. Playwright mobile: wordmark svg count 0, menu right-edge 378, header bell/profile 0, footer order exact, menu opens, menu Notifications shows badge `3` (identity resolved — anonymous claim works); desktop bell count 1. Crops `/tmp/opencode/probe-header.png`, `probe-footer.png`.
- **Next**: [M37.3] load-fast pass — `Icon.tsx` imports lucide's full `icons` registry (defeats tree-shaking; homepage First Load JS baseline **234 kB**) → explicit named imports; then build compare (awaits user Go — build was paused mid-session).

### Wide desktop layout pass (2026-09-29, [M38.1])
- **Containers** ([M38.1]): explore/search/arguments/articles/saved/hall-of-fame/categories `max-w-5xl/3xl/6xl` → `max-w-7xl` (explore measured 1280px @1920 vs previous ~960); profile `max-w-4xl` → `max-w-6xl`. Prose/reading (`[slug]`, articles body) and notifications inbox stay capped by design.
- **Columns**: hall-of-fame + categories grids gain `xl:grid-cols-4`; profile posts grid gains `lg:grid-cols-3`. Header search `max-w-xl` → `max-w-2xl`.
- **Home right rail**: desktop widget area is now `flex min-[1280px]:flex-row`; Trending Now + Hall of Fame moved into a 340px `<aside>` (right side ≥1280, stacks full-width below the grid under 1280, single mount — no duplicate widgets). Main grid reflows Debates/Articles/Categories/Facts/Stats/CTA.
- **Rail bug fixed**: `DesktopTrending`/`DesktopHallOfFame` fetched `.terms`/`.entries` but the API returns `{trending:[{query,count}]}`/`{featured:[...]}` — they rendered `null` silently (dead since creation). Converted to presentational components fed server-side in `page.tsx`'s `Promise.all` (removes 2 client fetches); `<aside>` only renders when data exists (no dead 340px gutter).
- **Dev seed**: dev DB had zero `searchclicks`/`halloffames` — seeded via mongosh (3 featured posts + 8 clicks) so the rail renders locally. Data-only, no code.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Playwright @1920: `HOME_RAIL x=1556 w=340`, `EXPLORE_WIDTH=1280`; @1100: aside below grid (y=2627 > grid bottom), w=980. Screenshots `/tmp/opencode/w2-{home,explore,categories,hof,articles,profile}.png`, `w2-stack-1100.png`.
- **Next**: [M38.2] restyle desktop Latest Lists to match skeleton (3 equal full-width cards, no JS width math) + mobile PostCarouselCard font reduction; then [M39] load-fast pass (Icon.tsx lucide named imports vs 234 kB baseline).

### CI/CD auto-deploy via GitHub Actions + SSH (2026-09-30, [M39.1])
- **Pipeline** ([M39.1]): push to `main` on `cocor-tech/yotop10` → `appleboy/ssh-action@v1.2.2` (pinned) → server runs `/root/deploy-scripts/deploy-yotop10.sh`. The four SSH secrets (host/port/user/key) set via `gh secret set`; key is ed25519, installed in `authorized_keys` behind a **forced-command shell** (`gha-shell.sh`) that permits only the deploy script (deny-test verified) with `no-pty`/no-forwarding; `authorized_keys` is `chattr +a` (append-only — lifted only for rotation).
- **Deploy gates** ([M39.1]): global `flock` on `/var/run/deploy-global.lock` serializes ALL deploys on the box (safe for 8 planned sites); fetch/reset from `cocor` (**not** `origin` — origin lags weeks and the first script draft hard-reset the tree to M31.4; killed pre-deploy, prod unaffected, bug fixed); build → **boot probe** on :3199 requires 200 before touching prod → `compose up -d --no-deps --force-recreate frontend` → verify 3100 = 200 → auto-rollback to previous image otherwise; dangling-image prune after success keeps disk flat (cleanup today: 53G→45G).
- **Concurrency**: `concurrency: server-yotop10` (no cancel) — one workflow at a time; extend the same group name in other sites' workflows to share the lock. Builds serialize on the server so a Next build never spikes RAM twice.
- **Verified** ([M39.1]): script run locally and via the SSH key path — both ended `deploy OK — 3100 returned 200`; forced-command deny path confirmed; workflow YAML validated; action tag exists.
- **First real CI runs** ([M39.2]): run #1 failed on the ssh-action **10m default command timeout** (client cut mid-build ~13-15 min; the orphaned server-side `docker build` kept the flock → run #2 was rejected by our own lock — fixed both: `command_timeout: 30m` + `flock -w 300` queue-instead-of-abort). Run #3 **success** end-to-end: push → SSH → build → boot probe → recreate → 200; container now runs the CI-built image. Prod verified healthy at every step; `paths-ignore` for md/docs keeps doc-only pushes from burning 15-min rebuilds. Repo also has pre-existing `ci.yml` (cloud typecheck/lint/build gates) and `cd.yml` (ghcr image publish, server-untouched) — complementary, left as-is.
- **Next**: watch first real Actions run on this push; then [M40] candidates — lucide named-imports load-fast pass, React #418 hydration fix.

### Engagement overhaul M40 — FireButton + instant feel (2026-09-30, [M40.2])
- **FireButton** ([M40.2]): shared optimistic toggle component (`frontend/src/components/FireButton.tsx`) — visual state flips immediately, API syncs behind, failure rolls back + error toast via `@/lib/toast`; `stopPropagation`/`preventDefault` so card-level links never fire on tap; size `sm` (34px, card footers/dense rows) vs `md` (40px touch target) fixes the "UI too big" complaint with per-context sizing; count in `tabular-nums`, flame scale-bump animation on toggle. Props `initialCount/initialReacted` + uncontrolled after mount.
- **Mount-key pattern** ([M40.2]): reaction-state hydration lands after mount, so uncontrolled optimistic buttons need `key={id}:{reacted}` to pick up hydrated state (used on `[slug]` comments). `onSync` prop available for pages keeping their own state trees.
- **`[slug]` page** ([M40.2]): comment fire button → FireButton; removed dead plumbing (`reacting` global lock state — a global lock made concurrent fires impossible and felt laggy, `handleReaction` await-round-trip, `updateCommentFireCount` tree walk, duplicate casts). `userReactions` set kept (drives hydration keys); `getReactionState` casts removed (endpoint now typed).
- **API client** ([M40.2]): `reactionsApi.toggleReaction` widened to `comment|post|list_item` + `ToggleReactionResponse` typed (back-compat fields from M40.1).
- **Tests** ([M40.2]): `FireButton.test.tsx` — 7 tests (optimistic flip before resolve, rollback+toast on failure, un-fire, stopPropagation inside links, sm/md sizing classes). Frontend 91/91 ✅, backend 709 ✅, all typecheck/lint/build gates ✅.
- **Next**: [M40.3] fire on post cards + post pages (PostCarouselCard footer, icons-only mobile) → [M40.4] list-item voting + community ranking → [M40.5] ShareButton coverage on cards (component exists for detail pages) → [M40.6] desktop proportion pass.

### Engagement overhaul M40 — backend reaction engine (2026-09-30, [M40.1])
- **Scope** ([M40.1]): user brief — better voting = fire on posts + list items, instant-feel UI, abuse resistance, share buttons everywhere, desktop UI too big (per-device sizing). Six sub-milestones; M40.1 is the backend foundation.
- **Route generalized** ([M40.1]): `POST /api/reactions` now accepts `target_type: comment|post|list_item` (was comment-only). Per-type dispatch helpers (`bumpFireCount`, `getFireCount`) keep every Mongoose call on a concrete model — union-of-models method calls don't typecheck. Legacy comment side effects preserved: boost @3 fires, spark recompute, ancestor propagation, ES reindex; posts get `last_engaged_at` + ES reindex; list items counter-only (not ES-indexed).
- **New files** ([M40.1]): `backend/src/schemas/reactions.ts` (Zod: toggle body / batch state query ≤50 targets / params — reactions route migrated off express-validator per defensive-schema rule); `backend/src/lib/fireRateLimit.ts` (in-memory sliding window, 30/min + 5-per-5s burst allowance, lazy sweep, per-fingerprint; documented single-server caveat — redis container still unused by backend) + 9 unit tests.
- **Model** ([M40.1]): `ListItem.fire_count` added (default 0, indexed) — Mongoose strict mode silently drops `$inc` on schema-absent paths. **Bug caught mid-edit**: first `str_replace` corrupted `source_url` block in ListItem.ts; repaired immediately and verified by full-file read.
- **Back-compat** ([M40.1]): response keeps all legacy fields (`success/action/target_type/target_id/fire_count/user_reacted`) + adds `count` alias — current frontend untouched and functional.
- **Gates** ([M40.1]): backend typecheck/lint/build ✅, `fireRateLimit` 9/9 ✅, root test ✅, frontend typecheck/lint ✅ (no FE changes yet).
- **Next**: [M40.2] FireButton component (optimistic toggle + rollback toast, mobile 34px / desktop 40px targets) → [M40.3] posts → [M40.4] list-item voting + community ranking → [M40.5] ShareButton → [M40.6] desktop proportion pass.

### Sidebar push layout + landscape cards + slim Docker image (2026-09-30, [M39.0])
- **Desktop sidebar** ([M39.0]): closed rail 72px icons-only (previous style per user decision), hover/tap-to-expand to 240px, outside-click + navigate collapse. `LogoMark` bars slide on open but **cap at x=32** (`translateX(-11px→0)` inside `px-8` container) — does not follow the full 240px. New `stores/sidebar.ts` zustand store (`open`, `setOpen`) shared by sidebar/ContentShell/top bar.
- **Push animation** ([M39.0]): `ContentShell` main `md:ml-[72px]`↔`md:ml-60` + `DesktopTopBarMinimal` header `md:left-[72px]`↔`md:left-60`, both `transition-[margin] duration-300 ease-out`; **exactly one ml class rendered per state** (two conflicting ml classes resolve by CSS order, not class order — root cause of the earlier no-shift bug). Mounted-guard for SSR hydration.
- **Top bar brand** ([M39.0]): `YO Top10` wordmark only (`<Logo showMark={false}>`, 0 svg), bars mark lives in the sidebar rail.
- **Latest Lists cards** ([M39.0]): `PostCarouselCard` rewritten to fixed-height landscape (`h-44 lg:h-80`), text left / media right (`w-[38%] lg:w-[40%] max-w-[300px]`), footer across bottom; desktop-only intro wrapped `<div className="hidden lg:block">` (block on the same element as `line-clamp-2` kills `-webkit-box`); mobile footer icons-only. `HomeSkeleton` desktop blocks h-64→h-80. Verified prod @1920: 536/563×320 open/closed, all landscape; @390: 284×176, no h-scroll.
- **Docker slimming** ([M39.0]): `output: "standalone"` + `outputFileTracingRoot: path.resolve(cwd, '..')` (**mandatory in monorepos** — without it the tracer infers the wrong root and standalone emits server.js with **zero node_modules**); pnpm `node-linker=hoisted` via `/app/.npmrc` (pnpm 10 has no `--node-linker` install flag; symlinked .pnpm store breaks under Docker COPY); builder runs `../node_modules/.bin/next build` (hoisted binaries aren't on pnpm exec's resolve path from a subpackage); runner CMD `node frontend/server.js` (traced output mirrors the monorepo layout). Boot-verified inside the image **before** deploy. Image **5.03GB → ~250MB**.
- **Incident** ([M39.0]): first slim deploy (219MB) crash-looped prod (`Cannot find module 'next'`, dangling pnpm symlinks) → yotop10.com down ~6.5h until the corrected hoisted build (with `outputFileTracingRoot` fix) was verified and redeployed. Root causes: symlink layout under COPY + missing tracing root + no pre-deploy boot test. Deploy checklist now: build → `docker run` boot probe → 200 on probe port → `compose up -d --no-deps --force-recreate frontend` → 3100 = 200.
- **Gates**: backend/frontend typecheck ✅ lint ✅ build ✅, root test ✅. Prod UI Playwright: closed aside 72/main 72, open 240/240, brand svgs 0, cards landscape, mobile no h-scroll; container healthy. Known follow-up: React #418 hydration warning on home (untracked, pre-existing pattern under investigation).
- **Next**: [M40] candidates — lucide named-imports load-fast pass (baseline 234 kB), React #418 hydration fix, then commit docs follow-ups.

### Latest Lists skeleton match + mobile font trim (2026-09-29, [M38.2])
- **Desktop Latest Lists** ([M38.2]): `DesktopCarousel` rewritten to the skeleton's guide — exactly 3 equal full-width cards (`w-[calc((100%_-_1.5rem)/3)]`, measured 592/592/592 @1920), zero 4th-card peek (clipped at scroll edge, `CARD4_X=1908 ≥ scroller_right=1896`), padding moved to an outer wrapper (padding-zone peek eliminated). JS width math, arrow buttons and all hooks removed → now a server component (native scroll + `snap-x` retained; >3 posts still swipeable, "View all" links to explore).
- **Mobile carousel card fonts**: title `text-lg`→`text-base` (16px, `min-h` 3.5rem→3rem), ranked items `text-sm`→`text-xs` (12px), byline `text-xs`→`text-2xs` (10px). Desktop `lg:` sizes untouched.
- **Gates**: frontend typecheck ✅ lint ✅ (0 errors). Playwright: desktop card widths equal & formula-exact, no peek; mobile computed sizes `{title:16px, item:12px, byline:10px}`. Screenshots `/tmp/opencode/latest-lists-1920.png`, `mobile-card-390.png`.
- **Next**: [M39] load-fast pass — `Icon.tsx` full lucide registry → explicit named imports (incl. backend category-icon superset), build compare vs **234 kB** homepage First Load JS baseline (build wipes `.next` → restart dev server after).
