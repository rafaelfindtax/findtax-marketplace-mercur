# Mercur Marketplace — Setup Docker

Ambiente de desenvolvimento 100% containerizado para o stack Mercur (MedusaJS v2 + 3 painéis), pronto para futura migração para AWS.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Rede: mercur-net                             │
│                                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                         │
│  │ postgres │   │  redis   │   │  minio   │   ← infra (futuro AWS:  │
│  │   :5432  │   │  :6379   │   │  :9000   │     RDS/ElastiCache/S3) │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘                         │
│       └────────┬─────┴─────────────┘                                │
│                │                                                     │
│         ┌──────▼───────┐                                             │
│         │   backend    │   :9000   MedusaJS v2 + MercurJS plugins   │
│         └──────┬───────┘                                             │
│                │                                                     │
│   ┌────────────┼────────────┐                                       │
│   │            │            │                                       │
│ ┌─▼──────┐ ┌──▼─────┐ ┌────▼─────┐                                  │
│ │ admin  │ │ vendor │ │storefront│                                   │
│ │ :5173  │ │ :7001  │ │  :3000   │                                  │
│ └────────┘ └────────┘ └──────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Pré-requisitos

- Docker Desktop 4.30+ ou Docker Engine 27+ com Compose v2
- 8 GB RAM livres (Medusa + Vite + Next juntos consomem ~4 GB)
- Portas livres no host: `3000`, `5173`, `5432`, `6379`, `7001`, `9000`, `9100`, `9101`

## Subindo o ambiente

```bash
cd /Users/rafaelalmeida/Desenv/marketplace

# Sobe tudo em modo dev (com hot reload)
make up

# Acompanhar logs (Ctrl+C para sair, containers continuam rodando)
make logs

# Apenas o backend
make logs SVC=backend
```

A primeira execução leva ~5 min para baixar imagens e instalar dependências (`pnpm install` em cada serviço durante o build).

## Inicializando o banco

Em outro terminal, depois que o `backend` subir (`make logs SVC=backend` mostra `ready on port 9000`):

```bash
make migrate    # cria as tabelas
make seed       # popula dados de exemplo (regions, currencies, products)
make admin      # cria admin@test.com / supersecret
```

## URLs de acesso

| Serviço         | URL                    | Credenciais                           |
|-----------------|------------------------|---------------------------------------|
| Backend API     | http://localhost:9000  | —                                     |
| Admin Panel     | http://localhost:5173  | admin@test.com / supersecret          |
| Vendor Panel    | http://localhost:7001  | criar via auto-registro               |
| Storefront      | http://localhost:3000  | —                                     |
| MinIO Console   | http://localhost:9101  | minioadmin / minioadmin               |
| MinIO API (S3)  | http://localhost:9100  | usar credenciais MinIO acima          |
| PostgreSQL      | localhost:5432         | postgres / postgres / db `mercurjs`   |
| Redis           | localhost:6379         | sem senha                             |

## Comandos do Makefile

```
make help              # lista todos os comandos
make up                # sobe (dev com hot reload)
make up-prod           # sobe sem override (prod-like)
make down              # derruba containers
make restart SVC=backend
make logs SVC=storefront
make rebuild           # rebuild sem cache
make backend-shell     # abre sh no backend
make psql              # abre psql no postgres
make redis-cli         # abre redis-cli
make minio-console     # abre console MinIO no browser
make clean             # 🚨 remove containers + volumes (apaga dados)
```

## Hot Reload

O `docker-compose.override.yml` é carregado automaticamente em dev e:

- Faz bind mount de cada pasta de serviço (`./backend`, `./admin-panel`, etc.) para `/app` no container
- Mantém `node_modules` em volumes anônimos (não sobrescritos pelo bind)
- Roda `pnpm dev` em vez do `pnpm start` de produção
- Habilita polling (`CHOKIDAR_USEPOLLING=true`) — necessário em macOS/Windows

Edite arquivos em `backend/src/`, `admin-panel/src/`, etc. e veja recarregar.

## Rodando em modo "prod-like"

Para validar imagens de produção localmente (mesmas que irão pro ECR):

```bash
make up-prod
```

Isso ignora o override e usa o `target: runtime` de cada Dockerfile.

## Estrutura de arquivos

```
marketplace/
├── docker-compose.yml              # base (prod-ready)
├── docker-compose.override.yml     # override automático para dev
├── .env                            # variáveis globais do compose
├── Makefile                        # atalhos de operação
├── README.docker.md                # este arquivo
├── README.md                       # README original do Mercur
├── backend/
│   ├── Dockerfile                  # multi-stage (base/deps/dev/build/runtime)
│   ├── .dockerignore
│   └── .env                        # config do Medusa
├── admin-panel/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env
├── vendor-panel/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env
└── storefront/
    ├── Dockerfile
    ├── .dockerignore
    └── .env.local
```

## Migração futura para AWS

Mapeamento direto dos componentes:

| Local (Docker)                | AWS                                         |
|-------------------------------|---------------------------------------------|
| `postgres:16-alpine`          | RDS PostgreSQL ou Aurora Serverless v2      |
| `redis:7-alpine`              | ElastiCache for Redis                       |
| `minio/minio`                 | S3 + IAM (mesma API; trocar endpoint)       |
| `backend` (target: runtime)   | ECS Fargate (atrás de ALB) ou EKS pod       |
| `admin-panel`, `vendor-panel` | S3 + CloudFront (build estático Vite)       |
| `storefront`                  | ECS Fargate ou Amplify Hosting (Next.js)    |
| Volumes nomeados              | EBS (RDS/Cache gerenciam o seu)             |
| `.env` files                  | AWS Secrets Manager + SSM Parameter Store   |
| Imagens                       | Amazon ECR                                  |

Os Dockerfiles já produzem imagens runtime sem dependências de dev, prontas para `docker push` no ECR. O `target: runtime` é o que será publicado.

Quando estivermos prontos, criamos:

1. Repositórios ECR para cada imagem
2. Task Definitions ECS apontando para o ECR
3. Service Discovery (Cloud Map) para resolução interna entre serviços
4. ALB com path routing (`/admin`, `/vendor`, `/`)
5. Migração das variáveis de `.env` para Secrets Manager / SSM

## Troubleshooting

### "port is already allocated"

Algum serviço local (Postgres do host, etc.) está usando a porta. Mude no `.env`:

```bash
POSTGRES_PORT=5433   # em vez de 5432
```

### Backend reclama de conexão com Postgres

```bash
make logs SVC=backend     # ver erro
make logs SVC=postgres    # ver se subiu
docker compose ps         # ver status dos healthchecks
```

### Hot reload não dispara

Garanta que `CHOKIDAR_USEPOLLING=true` está no override (já está). Em Linux nativo, pode desabilitar para performance.

### Resetar o ambiente do zero

```bash
make clean      # 🚨 apaga dados de Postgres/Redis/MinIO
make up
make migrate && make seed && make admin
```

### Imagem do backend muito grande

Já estamos com multi-stage: a imagem `runtime` só copia `.medusa/`, `node_modules` e `package.json`. Em produção, considere usar `pnpm prune --prod` na stage de build.

## Deploy para Railway (demo via seed SQL)

Para popular um banco remoto (Railway, RDS, Neon, etc.) com o estado atual do FINDTAX:

### 1. Gerar o dump local

```bash
make findtax-dump
# → cria backend/src/sample/findtax-seed.sql
# → ~500 KB, sem admin (criamos separado no destino)
# → inclui: 29 sellers + auth, 39 produtos, 29 stock locations,
#           29 fulfillment sets + service zones + geo_zones(br),
#           39 inventory levels, sales channel, region Brazil
```

### 2. No Railway — preparar o ambiente

```
1. New Project → Add PostgreSQL plugin
2. Add Service → Deploy from GitHub (este repo, pasta backend/)
3. Variables (backend service):
     DATABASE_URL=${{Postgres.DATABASE_URL}}  ← auto via plugin
     REDIS_URL=${{Redis.REDIS_URL}}            ← se adicionar Redis plugin
     JWT_SECRET=<gerar 32 chars random>
     COOKIE_SECRET=<gerar 32 chars random>
     ALGOLIA_APP_ID=...
     ALGOLIA_API_KEY=...                       ← admin key
     # Storage S3-compatível ou MinIO via Railway
4. Deploy → backend roda migrations automaticamente (cria schema)
```

### 3. Aplicar o dump no banco do Railway

Pegue a `DATABASE_URL` pública do plugin Postgres no Railway (Settings → TCP Proxy):

```bash
make findtax-restore TARGET_URL="postgres://postgres:SENHA@containers-us-west-N.railway.app:PORTA/railway"
# usa um container psql efêmero — não precisa instalar pg-client no Mac
```

### 4. Criar admin no Railway

```bash
# Via Railway Run (ou abrindo shell do service backend):
medusa user -e admin@findtax.com -p umaSenhaForteAqui
```

### 5. Configurar Algolia

```bash
# Pelo backend Railway, dispare init + sync:
curl -X POST https://SEU-BACKEND.up.railway.app/auth/user/emailpass \
  -d '{"email":"admin@findtax.com","password":"..."}'
# pegar o token, depois:
curl -X POST https://SEU-BACKEND.up.railway.app/admin/algolia \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Deploy do storefront

```
1. Add Service → Deploy from GitHub (pasta storefront/)
2. Variables:
     MEDUSA_BACKEND_URL=https://SEU-BACKEND.up.railway.app
     NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://SEU-BACKEND.up.railway.app
     NEXT_PUBLIC_DEFAULT_REGION=br
     NEXT_PUBLIC_ALGOLIA_ID=...
     NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=...    ← search-only key
```

### Re-gerar o seed após mudanças locais

Sempre que adicionar/editar sellers ou produtos via admin/scripts:

```bash
make findtax-dump          # regenera o .sql
git add backend/src/sample/findtax-seed.sql
git commit -m "chore: refresh findtax seed"
```

## Próximos passos sugeridos

- [ ] Adicionar `nginx` reverse proxy para servir tudo em `localhost:80`
- [ ] Configurar Algolia (busca de produtos) e Stripe Connect
- [ ] CI/CD: GitHub Actions buildando e empurrando para ECR
- [ ] Terraform para provisionar AWS (ECS + RDS + ElastiCache + S3 + ECR)
- [ ] Observabilidade: CloudWatch Logs + OpenTelemetry no backend
