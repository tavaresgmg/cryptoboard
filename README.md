# Crypto Dashboard — Fullstack App

Aplicacao fullstack para visualizacao de criptomoedas e gerenciamento de perfil de usuario, construida com **Vue 3**, **Fastify**, **MongoDB** e **TypeScript**.

> Teste tecnico fullstack para Erictel.

---

## Demo

<!-- TODO: Adicionar URL do deploy quando disponivel -->
<!-- - **Web:** https://crypto-web-xxxxx.run.app -->
<!-- - **API:** https://crypto-api-xxxxx.run.app/docs (Swagger) -->

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Vue 3 + Vite + Tailwind CSS 4 + shadcn-vue + vue-i18n |
| Backend | Fastify + Mongoose + Zod |
| Database | MongoDB (Atlas M0) |
| Auth | JWT (access token em memoria + refresh em HttpOnly cookie) |
| Security | Helmet, rate limiting, refresh token rotation |
| Testes | Vitest + Playwright |
| Storage | MinIO (local) / Cloudflare R2 (prod) — S3-compatible |
| Infra | Docker + GCP Cloud Run |
| Crypto API | [CoinPaprika](https://api.coinpaprika.com/) (free, sem API key) |

---

## Funcionalidades

- **Auth:** Login, registro, forgot/reset password, JWT com refresh token em HttpOnly cookie (rotacao automatica)
- **Perfil:** Visualizar e editar nome, email, descricao, avatar e moeda preferida (S3-compatible storage)
- **Criptomoedas:** Lista com busca, filtro por tipo (coin/token), paginação e detalhes em tela
- **Favoritos:** Marcar/desmarcar criptomoedas, lista dedicada de favoritos
- **i18n:** Espanhol (default), ingles e portugues
- **Seguranca:** Helmet, rate limiting, proxy same-origin, refresh token rotation
- **Protecao:** Rotas protegidas por JWT, sessao persistida com cookie seguro
- **API Docs:** Swagger auto-gerado em `/docs`
- **Responsivo:** Mobile-first, dark mode, loading/error states

---

## Pre-requisitos

- **Node.js** 20+ (LTS)
- **pnpm** 9+
- **Docker** e **Docker Compose** (para rodar com container)
- **MongoDB** (local ou Atlas — configuravel via env)

---

## Setup rapido (desenvolvimento)

### 1. Clonar e instalar

```bash
git clone https://github.com/SEU_USUARIO/crypto-dashboard.git
cd crypto-dashboard
pnpm install
```

### 2. Configurar variaveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` conforme necessario:

```env
# API
NODE_ENV=development
PORT=3000
WEB_ORIGIN=http://localhost:5173
WEB_APP_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/erictel
JWT_SECRET=troque-por-uma-chave-segura
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
COINPAPRIKA_BASE_URL=https://api.coinpaprika.com/v1

# S3 Storage (MinIO local / Cloudflare R2 prod)
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=avatars
AVATAR_MAX_BYTES=2097152

# Email (Resend — https://resend.com, free tier 100 emails/dia)
RESEND_API_KEY=re_YOUR_API_KEY_HERE
RESEND_FROM=noreply@yourdomain.com

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=1 minute

# Web
VITE_API_URL=/api
```

### 3. Rodar em desenvolvimento

```bash
# Terminal 1 — API
pnpm --filter api dev

# Terminal 2 — Web
pnpm --filter web dev
```

- **API:** http://localhost:3000
- **Swagger:** http://localhost:3000/docs
- **Web:** http://localhost:5173

---

## Setup com Docker

```bash
docker-compose up --build
```

Sobe 4 servicos:
- **api** (porta 3000)
- **web** (porta 8080)
- **mongo** (porta 27017)
- **minio** (porta 9000 API, 9001 console)

---

## Testes

```bash
# Unit + integration (API)
pnpm --filter api test

# Unit (Web)
pnpm --filter web test

# E2E (Playwright)
pnpm --filter web test:e2e
```

---

## Estrutura do projeto

```
/
├── apps/
│   ├── api/            # Backend — Fastify + TypeScript
│   └── web/            # Frontend — Vue 3 + Vite
├── packages/
│   └── shared/         # Schemas Zod + tipos TS compartilhados
├── docker/
│   └── docker-compose.yml
└── docs/               # Documentacao interna
```

Monorepo com **pnpm workspaces**. Tipos e validacoes compartilhados entre front e back via `packages/shared`.

---

## API Endpoints

| Metodo | Rota | Descricao | Auth |
|--------|------|-----------|------|
| POST | `/auth/register` | Criar usuario | Nao |
| POST | `/auth/login` | Login | Nao |
| POST | `/auth/refresh` | Renovar access token | Cookie |
| DELETE | `/auth/logout` | Logout | Sim |
| POST | `/auth/forgot-password` | Enviar email de reset | Nao |
| POST | `/auth/reset-password` | Resetar senha com token | Nao |
| GET | `/users/me` | Dados do usuario | Sim |
| PUT | `/users/me` | Atualizar perfil | Sim |
| PUT | `/users/me/avatar` | Upload de avatar (S3) | Sim |
| GET | `/users/me/avatar` | Redirect para presigned URL | Sim |
| POST | `/users/me/favorites/:coinId` | Adicionar favorito | Sim |
| DELETE | `/users/me/favorites/:coinId` | Remover favorito | Sim |
| GET | `/users/me/favorites` | Listar favoritos com precos | Sim |
| GET | `/crypto` | Listar criptomoedas | Sim |
| GET | `/crypto/:id` | Detalhes de uma cripto | Sim |
| GET | `/health` | Health check | Nao |

Documentacao completa com exemplos: **Swagger UI** em `/docs`.

---

## Decisoes tecnicas

| Decisao | Motivo |
|---------|--------|
| **Fastify** > Express | Mais rapido, plugin system, TS first-class |
| **shadcn-vue** > Vuetify | Codigo seu, customizavel, zero vendor lock-in |
| **MongoDB** > SQL | Valorizado na avaliacao, schema flexivel, Atlas free |
| **Zod compartilhado** | Mesma validacao front e back, type inference |
| **Monorepo** | 1 clone, 1 install, tipos compartilhados |
| **HttpOnly cookie** | Refresh token seguro, imune a XSS |
| **MinIO + R2** | S3-compatible, paridade local/prod, persiste no Cloud Run |
| **Helmet + rate limit** | Security headers + protecao brute force |
| **Proxy same-origin** | Nginx reverse proxy, zero CORS/CSRF |
| **vue-i18n** | ES, EN, PT-BR — empresa espanhola |
| **Favoritos** | Array no User, CRUD simples, valor pro usuario |

Detalhes completos em [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Scripts disponiveis

```bash
pnpm --filter api dev        # API em modo dev (hot reload)
pnpm --filter api build      # Build da API
pnpm --filter api test       # Testes unit + integration
pnpm --filter web dev        # Frontend em modo dev
pnpm --filter web build      # Build do frontend
pnpm --filter web test       # Testes unit
pnpm --filter web test:e2e   # Testes E2E (Playwright)
pnpm --filter api seed       # Seed: usuario de teste + favoritos
pnpm lint                    # Lint em todo o monorepo
pnpm typecheck               # Typecheck em todo o monorepo
```

---

## Licenca

Projeto desenvolvido como teste tecnico. Uso exclusivo para avaliacao.
