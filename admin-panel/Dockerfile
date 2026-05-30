# syntax=docker/dockerfile:1.7

# ============================================================================
# Mercur Admin Panel (Medusa Dashboard - React/Vite)
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
RUN --mount=type=cache,id=pnpm-admin,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: dev (alvo usado pelo override)
# ---------------------------------------------------------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
# Vite precisa escutar em 0.0.0.0 para ser acessível a partir do host
CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# ---------------------------------------------------------------------------
# Stage 4: build
# ---------------------------------------------------------------------------
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 5: runtime - servido via vite preview (ou troque por nginx em produção)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN apk add --no-cache libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate \
 && addgroup -S admin -g 1001 \
 && adduser -S admin -G admin -u 1001
WORKDIR /app

COPY --from=build --chown=admin:admin /app/dist ./dist
COPY --from=build --chown=admin:admin /app/package.json ./package.json
COPY --from=build --chown=admin:admin /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=admin:admin /app/node_modules ./node_modules

USER admin
EXPOSE 5173
CMD ["pnpm", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
