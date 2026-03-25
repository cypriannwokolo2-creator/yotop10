# YoTop10 — Dev Log

---

## 📅 2026-02-26

**Milestone:** M1 — Project Foundation

**Done today:**
- Set up server (UFW, SSH, Docker, Docker Compose)
- Traefik running on ports 80 + 443 with auto SSL
- Scaffolded Next.js (frontend) + FastAPI (backend)
- Docker Compose wired up — all 5 containers running (frontend, backend, postgres, redis, minio)
- Set up MinIO + created `yotop10-media` bucket with public download
- Pushed code to GitHub (github.com/nekwasar/yotop10)
- GitHub Actions self-hosted runner installed + running as service
- CI/CD deploy pipeline working — push to main auto-deploys to server
- `https://yotop10.com/api/health` returning `{"status":"ok","app":"YoTop10"}` ✅
- Organized docs into `docs/` folder

**Problems hit:**
- `create-next-app` initialized its own `.git` inside `frontend/` — caused it to be tracked as a git submodule. Fixed by removing embedded `.git` and re-adding as regular files.
- MinIO `localhost:9000` unreachable from host — port not exposed by design. Fixed by getting container's internal Docker IP.
- GitHub SSH key belonged to a different account (`jioka0/asabak`). Generated a new key for `nekwasar`.
- Server cloned repo via HTTPS — caused CI/CD `git pull` to fail. Fixed by adding a deploy key and switching remote to SSH.
- `psycopg2-binary 2.9.9` had no Python 3.13 wheel — bumped to 2.9.10.

**Tomorrow / Next:**
- Verify CI/CD deploy job is fully green
- Check `https://yotop10.com` loads in browser
- M2 — run Alembic migration to create all 21 database tables

**Mood:** 💪 Solid day. Full stack is live.

---

## 📅 2026-02-27

**Milestones:** M2 — Database Schema | M3 — Authentication System

**Done today:**

### M2 — Database Schema
- Wrote all 11 SQLAlchemy models: `user`, `category`, `post`, `list_item`, `community`, `comment`, `reaction`, `social`, `badge`, `moderation`, `ephemeral`
- Added `__init__.py` that imports all models so Alembic can auto-detect them
- Wrote idempotent seed script for categories, badges and auto-hide rules
- Enabled `uuid-ossp` extension in PostgreSQL
- Generated Alembic migration inside the backend container (where DB is live) using `docker exec yotop10_backend alembic revision --autogenerate`
- Ran `alembic upgrade head` — all 21 tables created in production PostgreSQL ✅
- Committed generated migration file back to repo

### M3 — Authentication System (Backend)
- `core/security.py` — bcrypt hashing, JWT access + refresh token creation/verify
- `core/email.py` — Brevo transactional email for verification + password reset
- `core/deps.py` — `get_current_user`, `get_current_user_optional`, `require_admin` FastAPI dependencies
- `schemas/auth.py` — Pydantic request/response models
- `crud/user.py` — all DB CRUD operations for users
- `services/auth.py` — register, login, Google OAuth, email verify, forgot/reset password business logic
- `api/v1/auth.py` — 8 HTTP endpoints wired up
- `main.py` — auth router included

### M3 — Authentication System (Frontend)
- NextAuth v5 config (`src/auth.ts`) — Credentials + Google providers, JWT session, stores backend tokens
- Catch-all route at `src/app/nextauth/[...nextauth]/route.ts`
- TypeScript type declarations for extended session
- 5 auth pages: `/signup`, `/login`, `/verify-email`, `/forgot-password`, `/reset-password`

### M3.5 — Planned
- Created `docs/milestones/m3.5.md` for anonymous sessions (device fingerprinting, anon JWT, migration on signup) — deferred until after M30 design system

---

**Problems hit (and fixed):**

| Bug | Root cause | Fix |
|-----|-----------|-----|
| Alembic couldn't autogenerate locally | No `DATABASE_URL` available locally | Generated inside Docker container on server where Postgres is accessible |
| Backend crash-loop on startup | `api/v1/__init__.py` used `from app.api.v1 import auth` (circular import) | Changed to `from .auth import router as auth_router` (relative import) |
| Frontend build: `Cannot find module '@/auth'` | `auth.ts` was in project root, but `@` alias maps to `src/` | Moved `auth.ts` → `src/auth.ts` |
| Frontend build: TypeScript type error on route handler | NextAuth v5 `handlers` is `{GET, POST}` object — was exporting whole object as GET/POST | Switched to `export const { GET, POST } = handlers` |
| Frontend build: `useSearchParams` Suspense error | Next.js App Router requires `useSearchParams()` inside a `<Suspense>` boundary | Split all 3 affected pages into inner/outer component with `<Suspense>` wrapper |
| Backend crash-loop: `ImportError: email-validator is not installed` | Pydantic's `EmailStr` type requires `email-validator` as separate package | Added `pydantic[email]` + `email-validator==2.2.0` to `requirements.txt` |
| Backend crash-loop: `ValueError: password cannot be longer than 72 bytes` | `passlib 1.7.4` incompatible with `bcrypt 4.0+` (bcrypt now raises instead of truncating in self-test) | Pinned `bcrypt==3.2.2` explicitly |
| `/api/auth/providers` 404 | Traefik routes ALL `/api/*` to FastAPI — NextAuth's internal routes also start with `/api/auth/` | Moved NextAuth basePath from `/api/auth` to `/nextauth` (avoids Traefik conflict entirely) |
| `/api/auth/register` 500 | Backend was crashing at startup due to above errors (never reached request handling) | Fixed by resolving all startup crash bugs above |
| Deploys canceling each other | Restarting the GitHub Actions runner while a job was in progress kills it | Never restart runner mid-job |
| Frontend OOM killed (exit 137) during `pnpm build` | Server has 1.8GB RAM, no swap — Next.js + Turbopack needs ~1.2GB | Added 2GB swap (`/swapfile`) + capped Node heap at `--max-old-space-size=800` in Dockerfile |
| `alembic upgrade head` failing in CI/CD | Used `docker exec` (requires healthy running container) on a crash-looping container | Switched to `docker compose run --rm backend alembic upgrade head` (fresh container, no dependency) |
| Frontend not rebuilding after basePath change | Docs-only commits don't touch frontend build context → Docker cache hit | Added comment to `layout.tsx` to bust cache; added `AUTH_URL` + `AUTH_TRUST_HOST` env vars for NextAuth v5 |
| Both builds OOM-killed simultaneously | `docker compose up -d --build` builds backend + frontend in parallel, exhausting RAM | Split into sequential steps: build backend → build frontend → `docker compose up -d` |

---

**State at end of day:**
- M2 ✅ — all 21 tables live in production PostgreSQL
- M3 ✅ — auth system deployed and building green (signup/login/verify/forgot/reset pages live)
- Swap added: 2GB `/swapfile` persistent across reboots
- CI/CD pipeline stabilized with sequential builds + `docker compose run` for migrations

**Tomorrow / Next:**
- M30 — Design system (before M4): color tokens, typography, component library (`auth-card`, `auth-btn`, etc.)
- Verify signup flow end-to-end at `https://yotop10.com/signup`
- M3.5 — Anonymous sessions (after M30)
- M4 — User profile page (built on M30 design system)

**Mood:** 🔥 Brutal day but every bug got squashed. Foundation is solid.

---
