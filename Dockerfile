# DevNotion dashboard — public view, token-gated publish/run/delete.
# Build:  docker build -t devnotion .
# Run:    docker run -p 3000:3000 --env-file .env.local devnotion
FROM node:22-slim

WORKDIR /app
RUN corepack enable

# Install deps first (cached layer). tsx is needed at runtime — no build step.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Production: trust-proxy + Secure cookies are enabled when NODE_ENV=production.
ENV NODE_ENV=production
EXPOSE 3000

# The server honors the platform's $PORT, else DASHBOARD_PORT (default 3000).
# Required env at runtime (set via --env-file or the platform's secrets), NEVER baked in:
#   DASHBOARD_PASSWORD_HASH  (scrypt of the unlock token)
#   GITHUB_TOKEN GITHUB_USERNAME GOOGLE_API_KEYS NOTION_TOKEN NOTION_PARENT_PAGE_ID
#   DEVTO_API_KEY PUBLISH_TARGETS IMAGE_PUBLIC_BASE_URL
# Persist run history + generated images across restarts by mounting a volume and
# pointing DEVNOTION_RUNS_PATH at it (e.g. /data/runs.json).
CMD ["pnpm", "dashboard"]
