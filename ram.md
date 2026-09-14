# RAM.md — Random Access Memory: Current Task State

> **Last updated**: 2026-09-14
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
