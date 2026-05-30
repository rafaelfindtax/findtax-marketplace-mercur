# syntax=docker/dockerfile:1.7

# ============================================================================
# Mercur Vendor Panel (React/Vite - dashboard de vendedores)
# ============================================================================

ARG NODE_VERSION=22.13.1

# ---------------------------------------------------------------------------
# Stage 1: base
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NODE_ENV=development
RUN apk add --no-cache libc6-compat python3 make g++ git \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: deps
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-vendor,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: dev
# Usa o launcher embutido (await-backend + node ./scripts/launch-vendor.js)
# ---------------------------------------------------------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV HOST=0.0.0.0 \
    PORT=7001
EXPOSE 7001
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
# Stage 4: build
# ---------------------------------------------------------------------------
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 5: runtime
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    HOST=0.0.0.0 \
    PORT=7001
RUN apk add --no-cache libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate \
 && addgroup -S vendor -g 1001 \
 && adduser -S vendor -G vendor -u 1001
WORKDIR /app

COPY --from=build --chown=vendor:vendor /app/dist ./dist
COPY --from=build --chown=vendor:vendor /app/package.json ./package.json
COPY --from=build --chown=vendor:vendor /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=vendor:vendor /app/node_modules ./node_modules
COPY --from=build --chown=vendor:vendor /app/scripts ./scripts

USER vendor
EXPOSE 7001
CMD ["pnpm", "start"]
