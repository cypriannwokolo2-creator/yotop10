# SEO Operator Guide — YoTop10

> **Last updated**: 2026-09-15
> Companion to the [M24.1]–[M24.5] enterprise SEO + OG overhaul. Code references are
> relative to the repo root.

## What exists

| Surface | URL | Source | Refresh |
|---|---|---|---|
| Sitemap index | `/sitemap.xml` | `frontend/src/app/sitemap.ts` | static structure |
| Posts | `/sitemap-posts.xml` | `sitemap-posts.xml/route.ts` | 5 min (`revalidate = 300`) |
| Articles | `/sitemap-articles.xml` | `sitemap-articles.xml/route.ts` | 5 min |
| Categories | `/sitemap-categories.xml` | `sitemap-categories.xml/route.ts` | 1 h |
| Profiles | `/sitemap-profiles.xml` | `sitemap-profiles.xml/route.ts` | 1 h |
| Static pages | `/sitemap-static.xml` | `sitemap-static.xml/route.ts` | static |
| Robots | `/robots.txt` | `frontend/src/app/robots.ts` | static |
| OG images (post) | `/<slug>/opengraph-image` | `app/[slug]/opengraph-image.tsx` | 1 h, immutable |
| OG images (article) | `/articles/<slug>/opengraph-image` | `app/articles/[slug]/opengraph-image.tsx` | 1 h, immutable |
| OG images (home) | `/opengraph-image` | `app/opengraph-image.tsx` | 5 min, immutable |
| OG images (profile) | `/a/<username>/opengraph-image` | `app/a/[username]/opengraph-image.tsx` | 1 h, immutable |
| OG images (category) | `/og/category?slug=<slug>` | `app/og/category/route.tsx` (route handler, NOT file convention — `c/[[...slug]]` is a catch-all and Next.js forbids children after catch-alls; nginx proxies `/api/*` to the backend so the `/og/*` path is used) | on demand, immutable |
| Twitter images | `/twitter-image`, `/<slug>/twitter-image`, `/articles/<slug>/twitter-image`, `/a/<username>/twitter-image` | `twitter-image.tsx` re-exports of the OG generators | same as OG |

All OG images are self-hosted via `next/og` (Satori, zero external deps), 1200×630
PNG, Geist Sans/Mono TTF loaded once at module scope (`frontend/src/lib/seo/ogFonts.ts`),
shared Satori-safe JSX primitives (`frontend/src/lib/seo/ogImageLayout.tsx`).
Satori constraints that bit us before (documented here so nobody reintroduces them):

- `display` is `flex | contents | none` only — never `-webkit-box`, `block`, `grid`.
- Line clamp is `lineClamp: N` (number) — never `WebkitLineClamp`/`WebkitBoxOrient`.
- Fonts are TTF/OTF/WOFF `ArrayBuffer`s passed via the `fonts` option — never
  `system-ui`/`monospace` strings, never WOFF2 (Satori cannot parse it).
- Inline `style` objects only — no `className`, no Tailwind, no CSS variables in
  older Satori, no `calc()`, no viewport units.
- Route file and its `page.tsx` MUST declare the same `runtime` or the build
  breaks (vercel/next.js#77796). This repo standardizes on `runtime = 'nodejs'`.

Page metadata builders live in `frontend/src/lib/seo/metadata.ts`:
`buildArticleMetadata` (`og:type: article` + `article:{publishedTime,authors,section,tags}`),
`buildProfileMetadata` (`og:type: profile` + `username/firstName/lastName`),
`buildWebsiteMetadata` (`og:type: website`). Every page sets `alternates.canonical`
and `og:url` from `NEXT_PUBLIC_SITE_URL`; the two MUST stay in sync (share counters
aggregate on `og:url`).

## IndexNow (Bing / Yandex / Seznam / Naver)

Code: `backend/src/lib/indexnow.ts` (+ `indexnow.test.ts`). Hooks:
`PATCH /api/admin/posts/:id/approve`, `POST /api/admin/posts/bulk/approve`,
`PATCH /api/admin/articles/:id/approve`, `POST /api/admin/articles/bulk/approve`.
Fire-and-forget — never blocks the admin response; failures warn-log only.
Inert when `INDEXNOW_API_KEY` is empty.

To activate:

1. Generate a key: `openssl rand -hex 16` (16–64 hex chars).
2. Set `INDEXNOW_API_KEY` in `.env` to the generated value (and document rotation in 1Password/vault).
3. Host the ownership file: create `frontend/public/<key>.txt` containing exactly
   the key string (no trailing newline issues — single line), rebuild + redeploy
   the frontend so it serves at `https://www.yotop10.com/<key>.txt`.
4. Verify: `curl https://www.yotop10.com/<key>.txt` must return the key with HTTP 200.
5. Approve any post in admin → check backend logs for `[IndexNow]` (absence of the
   warning line = accepted HTTP 200 from `api.indexnow.org`).
6. Confirm receipt in Bing Webmaster Tools → URL Submission → IndexNow.

Google does NOT support IndexNow. For Google, use Search Console (below).

## Google Search Console (manual, no code)

1. Add property `https://www.yotop10.com` (URL-prefix mode).
2. Verify via DNS TXT (preferred — survives redeploys) or HTML file upload.
3. Sitemaps → Add `https://www.yotop10.com/sitemap.xml`.
4. URL Inspection → test one post, one article, one profile URL; confirm
   "URL is on Google" after the first crawl.
5. After any host cutover or bulk URL change: Sitemaps → resubmit + use
   `https://www.google.com/ping?sitemap=https://www.yotop10.com/sitemap.xml`.

## Bing Webmaster Tools (manual, no code)

1. Add site `https://www.yotop10.com`, verify (same options as GSC).
2. Sitemaps → Submit `https://www.yotop10.com/sitemap.xml`.
3. URL Submission → confirm IndexNow receipts appear after the first admin approval.

## Validating cards before sharing

- Facebook Sharing Debugger: `https://developers.facebook.com/tools/debug/` →
  paste URL → Scrape Again (busts the ~30-day image cache).
- X Card Validator: `https://cards-dev.twitter.com/validator`.
- LinkedIn Post Inspector: `https://www.linkedin.com/post-inspector/`.
- Local: `curl -s https://www.yotop10.com/<slug> | grep -oE
  'rel="canonical"[^>]+|property="og:[^"]+" content="[^"]{0,80}'` — canonical and
  `og:url` must be identical `https://www.yotop10.com/...` URLs, never `/undefined`,
  never the apex. `og:image` must be an absolute `https://...` URL returning
  `Content-Type: image/png` with `Cache-Control: public, immutable, ...`.

## After a host cutover

1. Resubmit `sitemap.xml` in GSC + Bing WMT (new origin = new crawl scheduling).
2. Expect every visitor to strand (cookies don't cross hosts) — run `docs/relink.md`.
3. Regenerate the IndexNow key file if the domain changed (key file is per-host).
4. Re-verify one URL of each type in URL Inspection (post, article, profile,
   category, homepage).
