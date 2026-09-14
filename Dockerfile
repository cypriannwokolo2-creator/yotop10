FROM node:20-alpine AS base
# Install pnpm and pm2
RUN npm install -g pnpm@10 pm2

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
# pnpm workspaces symlink sub-package deps into the ROOT store — the root
# node_modules MUST travel with the subdir ones or every binary dangles.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .
# Set internal API URL for SSR (not NEXT_PUBLIC_* — these are never baked client-side)
ENV INTERNAL_API_URL=http://localhost:8000/api
RUN cd frontend && pnpm build
RUN cd backend && pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
# Install pnpm, pm2, and tsx for running seed scripts
RUN npm install -g pnpm@10 pm2 tsx

# Copy built artifacts and config (non-standalone Next: whole frontend dir)
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/src/scripts ./backend/src/scripts
COPY --from=builder /app/backend/src/models ./backend/src/models
COPY --from=builder /app/backend/tsconfig.json ./backend/
COPY --from=builder /app/ecosystem.config.js /app/ecosystem.config.js

# Start command
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
