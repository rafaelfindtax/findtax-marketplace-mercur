# syntax=docker/dockerfile:1.7

# ============================================================================
# Mercur Backend (MedusaJS v2 + MercurJS plugins)
# Multi-stage Dockerfile pronto para dev (com volume mount) e produção (ECR)
# ============================================================================

ARG NODE_VERSION=22.13.1

# ---------------------------------------------------------------------------
# Stage 1: base - imagem comum com pnpm habilitado via corepack
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
# Stage 2: deps - instala dependências (cache otimizado)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-backend,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 3: dev - alvo usado pelo docker-compose.override.yml com bind mount
# ---------------------------------------------------------------------------
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 9000
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
# Stage 4: build - compila o backend para produção
# ---------------------------------------------------------------------------
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 5: runtime - imagem final mínima (alvo para ECR / produção)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH
RUN apk add --no-cache libc6-compat \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate \
 && addgroup -S medusa -g 1001 \
 && adduser -S medusa -G medusa -u 1001
WORKDIR /app

COPY --from=build --chown=medusa:medusa /app/.medusa ./.medusa
COPY --from=build --chown=medusa:medusa /app/package.json ./package.json
COPY --from=build --chown=medusa:medusa /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build --chown=medusa:medusa /app/node_modules ./node_modules

USER medusa
EXPOSE 9000
CMD ["pnpm", "start"]
