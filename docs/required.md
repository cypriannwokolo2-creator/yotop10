# YoTop10 — Pre-Development Checklist (Self-Hosted, Free Stack)

> Built for your own server. Designed to comfortably handle 10–20k monthly users.

---

## 🖥️ Server Setup (Do This First)

- [ ] Know your server's OS (Ubuntu 22.04 LTS recommended — if you can reinstall, do it)
- [ ] SSH access confirmed and working
- [ ] Set up a non-root sudo user (`adduser yotop10 && usermod -aG sudo yotop10`)
- [ ] Disable root SSH login (`PermitRootLogin no` in `/etc/ssh/sshd_config`)
- [ ] Set up SSH key authentication (disable password login)
- [ ] Configure UFW firewall:
  ```
  ufw allow OpenSSH
  ufw allow 80
  ufw allow 443
  ufw enable
  ```

---

## 🌐 Domain & DNS

> **One subdomain used:** `cdn.yotop10.com` for direct MinIO image serving. Everything else routes through path prefixes on the apex domain:
> - `yotop10.com` → Next.js frontend
> - `yotop10.com/api/*` → FastAPI backend
> - `yotop10.com/admin` → Admin dashboard (protected Next.js route)
> - `cdn.yotop10.com` → MinIO image storage (direct public image serving)

- [ ] Purchase domain (e.g., `yotop10.com`) — cheapest: Porkbun, Namecheap
- [ ] Create free **Cloudflare** account → point nameservers to Cloudflare
- [ ] Add **A record**: `yotop10.com` → your server IP (set to **DNS only / grey cloud** during initial SSL setup)
- [ ] Add **CNAME**: `www` → `yotop10.com` (proxy ON)
- [ ] Add **CNAME**: `cdn` → `yotop10.com` (DNS only / grey cloud — Traefik handles SSL for this too)
- [ ] Add Cloudflare **Redirect Rule**: `www.yotop10.com/*` → `https://yotop10.com/$1` (301 permanent)
- [ ] After Traefik SSL confirmed working → switch A record to **proxy ON (orange cloud)**
- [ ] Set up email forwarding via Cloudflare Email Routing (free): `support@yotop10.com` → your Gmail

---

## 📦 Install on Server

> Install these in order. Everything is free and open source.

### Core Runtime
- [ ] **Docker** + **Docker Compose** — containerize everything cleanly
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  ```

### Reverse Proxy & SSL
- [ ] **Traefik v3** — shared reverse proxy for ALL apps on the server (free, open source)
  - Auto-discovers containers via Docker labels — zero manual config per new app
  - Handles Let's Encrypt SSL automatically
  - Lives at `/opt/traefik` (server-wide, not per-app)
  - Create shared Docker network: `docker network create traefik-public`
- [ ] Confirm SSL certificate auto-issued for `yotop10.com`

### Database
- [ ] **PostgreSQL 16** — via Docker or installed directly
- [ ] Create production database + user with limited privileges
- [ ] Test local connection

### Cache & Rate Limiting
- [ ] **Redis 7** — via Docker
- [ ] Used for: rate limiting, session caching, ephemeral thread timers, verdict meter queuing

### Process Management
- [ ] Everything runs inside **Docker containers** — no PM2 or Systemd needed for app processes
- [ ] PM2 / Systemd only needed if you ever run processes outside Docker (not the case for YoTop10)

### Image Storage
- [ ] **MinIO** — self-hosted S3-compatible object storage (free, handles any scale)
  - Runs on your server, stores uploaded images
  - Access via browser: `http://yourserver:9001`
  - Set max upload size: 5MB
  - Create a bucket: `yotop10-media`

### OG Image Generation
- [ ] **Playwright** (self-hosted) — generates shareable list/battle/verdict cards server-side
  - No third-party API needed
  - Install via Python: `pip install playwright && playwright install chromium`

### Error Tracking
- [ ] **GlitchTip** — free self-hosted Sentry alternative (Docker Compose)
  - Lightweight, catches frontend + backend errors
  - Dashboard at `http://yourserver:8000`

### Monitoring
- [ ] **Netdata** — real-time server monitoring (free, installs in one command)
  ```bash
  bash <(curl -Ss https://my-netdata.io/kickstart.sh)
  ```
- [ ] **UptimeKuma** — self-hosted uptime monitoring + alerts (Docker)
  - Monitor your frontend, API, and DB health
  - Free email/Telegram alerts

### Backups
- [ ] Set up daily `pg_dump` cron job → save to `/backups/` on server
- [ ] Optional: copy backups to a free **Backblaze B2** bucket (10GB free)

---

## 🔐 Accounts to Create (Free Tiers Only)

| Service | Purpose | Free Tier |
|---|---|---|
| **GitHub** | Code hosting, CI/CD, Issues | Free public repos |
| **Cloudflare** | DNS, DDoS, email routing | Free |
| **Google Cloud** | Google OAuth only | Free (OAuth has no cost) |
| **Brevo** (ex-Sendinblue) | Transactional email (verification, digests, strike notices) | 300 emails/day free |

> Everything else runs on your server — no third-party paid service needed.

---

## 🔑 API Keys & Secrets to Collect

> Save all of these in a `.env` file. Never commit to GitHub.

### Authentication
- [ ] `GOOGLE_CLIENT_ID` — Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` — Google Cloud Console
- [ ] `NEXTAUTH_SECRET` → `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` → `https://yotop10.com`

### Database
- [ ] `DATABASE_URL` → `postgresql://user:pass@localhost:5432/yotop10`

### Redis
- [ ] `REDIS_URL` → `redis://localhost:6379`

### Email (Brevo)
- [ ] `BREVO_API_KEY` — from Brevo dashboard
- [ ] `EMAIL_FROM` → `noreply@yotop10.com`

### Image Storage (MinIO)
- [ ] `MINIO_ENDPOINT` → `http://localhost:9000`
- [ ] `MINIO_ACCESS_KEY`
- [ ] `MINIO_SECRET_KEY`
- [ ] `MINIO_BUCKET` → `yotop10-media`

### Backend (FastAPI)
- [ ] `SECRET_KEY` → `openssl rand -hex 32`
- [ ] `ALGORITHM` → `HS256`
- [ ] `ACCESS_TOKEN_EXPIRE_MINUTES` → `43200`
- [ ] `CORS_ORIGINS` → `https://yotop10.com`

### Error Tracking
- [ ] `GLITCHTIP_DSN` — from your self-hosted GlitchTip dashboard

---

## 🔐 Google OAuth Setup

- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create project: `YoTop10`
- [ ] Enable **People API**
- [ ] Create OAuth 2.0 credentials (Web Application)
- [ ] Add redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://yotop10.com/api/auth/callback/google`
- [ ] Copy Client ID + Secret to `.env`

---

## 🔄 CI/CD Setup

- [ ] **GitHub Actions** (free for public repos)
- [ ] Set up a **self-hosted GitHub Actions runner** on your server:
  ```bash
  # In GitHub repo → Settings → Actions → Runners → New self-hosted runner
  ```
- [ ] Workflows to create:
  - `lint-test.yml` — runs on every PR
  - `deploy.yml` — SSH into server + pull + restart on merge to `main`
- [ ] Store secrets in GitHub Actions: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`

---

## 🛠️ Local Dev Environment

- [ ] **Node.js** v20+ (`node -v`)
- [ ] **Python** 3.11+ (`python --version`)
- [ ] **pnpm** (`npm install -g pnpm`)
- [ ] **uv** — fast Python package manager (`pip install uv`)
- [ ] **Frontend Design Libraries** — `next-themes`, `framer-motion`, `lucide-react`, `canvas-confetti`, `clsx`, `tailwind-merge`
- [ ] **Docker Desktop** — run PostgreSQL + Redis locally without installing them
- [ ] **Git** configured
- [ ] **VS Code** with: ESLint, Prettier, Pylance, GitLens
- [ ] **Bruno** — free open-source API testing (Postman alternative)
- [ ] **TablePlus** (free tier) or **DBeaver** (fully free) — DB GUI

---

## 📁 Repository Setup

- [ ] Create GitHub repo: `yotop10` (public)
- [ ] Initialize with `README.md` + `LICENSE` (MIT)
- [ ] Add `.gitignore` (Node + Python)
- [ ] Add `.env.example` (all keys, no values)
- [ ] Project folder structure:
  ```
  /yotop10
  ├── /frontend         (Next.js)
  ├── /backend          (FastAPI)
  ├── /docker           (Docker Compose configs)
  ├── /docs             (documentation files)
  ├── .github/workflows (CI/CD)
  ├── .env.example
  ├── README.md
  ├── milestones.md
  ├── product_spec.md
  ├── documentation_plan.md
  └── required.md
  ```

---

## 🧱 Database Prep

- [ ] Design full schema (M2 from milestones)
- [ ] Install **Alembic** for migrations (`pip install alembic`)
- [ ] Create first migration file
- [ ] Run migration on local PostgreSQL
- [ ] Verify all tables created

---

## 📋 Misc

- [ ] Set up support email inbox (`support@yotop10.com`) — use Cloudflare Email Routing → forward to your personal Gmail
- [ ] Write `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`
- [ ] Create GitHub Issues labels: `bug`, `feature`, `docs`, `good first issue`
- [ ] Set up GitHub Projects board (free) to track milestones

---

## ✅ Capacity Check

> For 10–20k monthly users, this free self-hosted stack is more than enough:

| Component | Tool | Handles |
|---|---|---|
| Reverse proxy | Traefik | millions of req/day, multi-app |
| App server | Next.js + FastAPI (Docker) | 10k–100k users easily |
| Database | PostgreSQL | millions of rows |
| Cache | Redis | sub-ms response |
| Images | MinIO | unlimited (disk only) |
| Monitoring | Netdata + UptimeKuma | real-time |
| Email | Brevo free | ~9k emails/month free |
