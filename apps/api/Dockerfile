# FELIZ API — production image.
#
# Built for Linux, so Prisma generates the correct native query engine
# binary inside the container (this is what kept failing when packaging
# from Windows for Elastic Beanstalk).
#
# Multi-stage:
#   deps   — install all workspace deps (with dev) once, cached by lockfile.
#   build  — prisma generate + turbo build (packages then api).
#   runner — slim runtime with only what's needed to run the API.
#
# The build context is the MONOREPO ROOT (apps/api/../..), so the whole
# pnpm workspace is available. See .dockerignore next to this file.

# ---------- deps ----------
FROM node:22-slim AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy manifests first for layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
# Note: apps/landing is a static HTML site (no package.json), so it is not
# a pnpm workspace member and is intentionally not copied here.
COPY apps/api/package.json apps/api/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY apps/admin/package.json apps/admin/package.json
COPY apps/portal/package.json apps/portal/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM deps AS build
WORKDIR /app
# Bring in the full source now that deps are installed and cached.
COPY . .
# Generate the Prisma client (Linux engine) and build packages + api.
RUN pnpm --filter @feliz/database exec prisma generate
RUN pnpm --filter @feliz/shared-types --filter @feliz/config --filter @feliz/database build
RUN pnpm --filter @feliz/api build

# ---------- runner ----------
FROM node:22-slim AS runner
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production
# Elastic Beanstalk's Docker platform forwards traffic to port 8080.
ENV PORT=8080

# Copy the whole built workspace. Simplest reliable approach: the image
# already contains node_modules with the correct Linux Prisma engine and
# all @feliz/* packages linked, so the app runs as-is.
COPY --from=build /app /app

EXPOSE 8080

# Run pending migrations, then start the API. `migrate deploy` is
# idempotent (only applies migrations not yet recorded), so it's safe on
# every boot.
CMD ["sh", "-c", "pnpm --filter @feliz/database exec prisma migrate deploy && node apps/api/dist/main.js"]
