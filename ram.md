# RAM.md — Random Access Memory: Current Task State

> **Last updated**: 2026-09-15
> **Working tree**: Clean — committed and pushed
> **Branch**: main → up to date with origin/main
> **Latest commits**: `d1d0526 [M04.1]`, `122960f [M15.1]`, `dae0916 [M18.6]`, `e4d6821 [M20.3]` (+M20.1/M20.2/DOC)

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
| Backend tests (vitest) | ✅ 38 files, 638 tests passed |

---

## What Has Been Done

### Recent commits (top of main):
1. **[M00.8]** Lower nav hide breakpoint to 980px, uncomment DynamicIsland hydration fix
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
M1 (Foundation), M2 (Schema), M3 (Submit), M4 (Feed), M5 (Post Detail), M6 (Categories), M7 (Comments), M9 (Admin Auth), M10 (Admin Dashboard), M11 (User System), M12 (Search), M13 (Arguments), M14 (Hall of Fame), M15 (Identity), M17 (Moderator System)

### ROM issues resolved ✅ (14 of 19):
Hardcoded JWT, orphaned setInterval, $regex injection, stub 200s, health check ordering, dynamic import on approval, module-level cron, 'unknown' fingerprint, Redis singleton, route barrel export, localStorage crashes, 425 infinite recursion, XSS in JSON-LD, Eruda safety guards

---

## What Remains Open

### Still open ROM issues (5 marked ⏳):
| # | Issue | Notes |
|---|-------|-------|
| 1.9 | MongoDB replica set for transactions | `withTransaction()` crashes on standalone |
| 1.10 | Orphaned comments on deletion | Grandchildren may be orphaned |
| 2.7 | TOCTOU rate limit race | Non-atomic zRemRange/zCard/zAdd |
| 2.8 | findOne→findOneAndUpdate race | Display name update in users.ts |
| 2.10 | Non-null assertion after findById | `!` in posts.ts:488 |

### Unfinished features:
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

1. **Lock in stability** — Fix 5 remaining ROM issues (crash/data integrity)
2. **Complete admin UI** — Categories tree view, remaining components
3. **Build the Arena** — M5.6 Counter-List System (major feature)
4. **Deploy & verify** — Production deployment
5. **Post-MVP** — V2 features, theming, notifications

---

## Latest Verification

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
