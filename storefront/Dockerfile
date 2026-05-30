# syntax=docker/dockerfile:1.7

# ============================================================================
# Mercur Storefront (Next.js 15 + React 19)
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
RUN --mount=type=cache,id=pnpm-storefront,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: dev
# ---------------------------------------------------------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV HOSTNAME=0.0.0.0 \
    PORT=3000
EXPOSE 3000
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
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN apk add --no-cache libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate \
 && addgroup -S nextjs -g 1001 \
 && adduser -S nextjs -G nextjs -u 1001
WORKDIR /app

COPY --from=build --chown=nextjs:nextjs /app/.next ./.next
COPY --from=build --chown=nextjs:nextjs /app/public ./public
COPY --from=build --chown=nextjs:nextjs /app/package.json ./package.json
COPY --from=build --chown=nextjs:nextjs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=nextjs:nextjs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nextjs /app/next.config.ts ./next.config.ts

USER nextjs
EXPOSE 3000
CMD ["pnpm", "start"]
