# Crypto Dashboard — Fullstack App

Fullstack application for cryptocurrency viewing and user profile management, built with **Vue 3**, **Fastify**, **MongoDB** and **TypeScript**.

> Fullstack technical challenge for Erictel.

---

## Demo

<!-- TODO: Add deploy URL when available -->
<!-- - **Web:** https://crypto-web-xxxxx.run.app -->
<!-- - **API:** https://crypto-api-xxxxx.run.app/docs (Swagger) -->

---

## Stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Frontend   | Vue 3 + Vite + Tailwind CSS 4 + shadcn-vue + vue-i18n          |
| Backend    | Fastify + Mongoose + Zod                                       |
| Database   | MongoDB (Atlas M0)                                             |
| Auth       | JWT (access token in memory + refresh in HttpOnly cookie)      |
| Security   | Helmet, rate limiting, refresh token rotation                  |
| Tests      | Vitest + Playwright                                            |
| Storage    | MinIO (local) / Cloudflare R2 (prod) — S3-compatible           |
| Infra      | Docker + GCP Cloud Run                                         |
| Crypto API | [CoinPaprika](https://api.coinpaprika.com/) (free, no API key) |

---

## Features

- **Auth:** Login, registration, forgot/reset password, JWT with refresh token in HttpOnly cookie (automatic rotation)
- **Profile:** View and edit name, email, description, avatar and preferred currency (S3-compatible storage)
- **Cryptocurrencies:** List with search, filter by type (coin/token), pagination and on-screen details
- **Favorites:** Mark/unmark cryptocurrencies, dedicated favorites list
- **i18n:** Spanish (default), English and Portuguese
- **Security:** Helmet, rate limiting, same-origin proxy, refresh token rotation
- **Protection:** JWT-protected routes, session persisted with secure cookie
- **API Docs:** Auto-generated Swagger at `/docs`
- **Responsive:** Mobile-first, dark mode, loading/error states

---

## Prerequisites

- **Node.js** 20+ (LTS)
- **pnpm** 9+
- **Docker** and **Docker Compose** (to run with containers)
- **MongoDB** (local or Atlas — configurable via env)

---

## Quick Setup (Development)

### 1. Clone and install

```bash
git clone https://github.com/SEU_USUARIO/crypto-dashboard.git
cd crypto-dashboard
pnpm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit the `.env` as needed:

```env
# API
NODE_ENV=development
PORT=3000
WEB_ORIGIN=http://localhost:5173
WEB_APP_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/erictel
JWT_SECRET=change-me-to-a-secure-key
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

# Email (Resend — https://resend.com, free tier 100 emails/day)
RESEND_API_KEY=re_YOUR_API_KEY_HERE
RESEND_FROM=noreply@yourdomain.com

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=1 minute

# Web
VITE_API_URL=/api
```

### 3. Run in development

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

## Docker Setup

```bash
docker-compose up --build
```

Starts 4 services:

- **api** (port 3000)
- **web** (port 8080)
- **mongo** (port 27017)
- **minio** (port 9000 API, 9001 console)

---

## Tests

```bash
# Unit + integration (API)
pnpm --filter api test

# Unit (Web)
pnpm --filter web test

# E2E (Playwright)
pnpm --filter web test:e2e
```

---

## Project Structure

```
/
├── apps/
│   ├── api/            # Backend — Fastify + TypeScript
│   └── web/            # Frontend — Vue 3 + Vite
├── packages/
│   └── shared/         # Shared Zod schemas + TS types
└── docker-compose.yml
```

Monorepo with **pnpm workspaces**. Types and validations shared between front and back via `packages/shared`.

---

## API Endpoints

| Method | Route                         | Description                | Auth   |
| ------ | ----------------------------- | -------------------------- | ------ |
| POST   | `/auth/register`              | Create user                | No     |
| POST   | `/auth/login`                 | Login                      | No     |
| POST   | `/auth/refresh`               | Renew access token         | Cookie |
| DELETE | `/auth/logout`                | Logout                     | Yes    |
| POST   | `/auth/forgot-password`       | Send reset email           | No     |
| POST   | `/auth/reset-password`        | Reset password with token  | No     |
| GET    | `/users/me`                   | User data                  | Yes    |
| PUT    | `/users/me`                   | Update profile             | Yes    |
| PUT    | `/users/me/avatar`            | Upload avatar (S3)         | Yes    |
| GET    | `/users/me/avatar`            | Redirect to presigned URL  | Yes    |
| POST   | `/users/me/favorites/:coinId` | Add favorite               | Yes    |
| DELETE | `/users/me/favorites/:coinId` | Remove favorite            | Yes    |
| GET    | `/users/me/favorites`         | List favorites with prices | Yes    |
| GET    | `/crypto`                     | List cryptocurrencies      | Yes    |
| GET    | `/crypto/:id`                 | Cryptocurrency details     | Yes    |
| GET    | `/health`                     | Health check               | No     |

Full documentation with examples: **Swagger UI** at `/docs`.

---

## Technical Decisions

| Decision                 | Reason                                                  |
| ------------------------ | ------------------------------------------------------- |
| **Fastify** > Express    | Faster, plugin system, TS first-class                   |
| **shadcn-vue** > Vuetify | Own code, customizable, zero vendor lock-in             |
| **MongoDB** > SQL        | Valued in the assessment, flexible schema, Atlas free   |
| **Shared Zod**           | Same validation front and back, type inference          |
| **Monorepo**             | 1 clone, 1 install, shared types                        |
| **HttpOnly cookie**      | Secure refresh token, immune to XSS                     |
| **MinIO + R2**           | S3-compatible, local/prod parity, persists on Cloud Run |
| **Helmet + rate limit**  | Security headers + brute force protection               |
| **Same-origin proxy**    | Nginx reverse proxy, zero CORS/CSRF                     |
| **vue-i18n**             | ES, EN, PT-BR — Spanish company                         |
| **Favorites**            | Array in User, simple CRUD, user value                  |

See [`NOTES.md`](NOTES.md) for tradeoffs and honest assessment.

---

## Available Scripts

```bash
pnpm --filter api dev        # API in dev mode (hot reload)
pnpm --filter api build      # Build the API
pnpm --filter api test       # Unit + integration tests
pnpm --filter web dev        # Frontend in dev mode
pnpm --filter web build      # Build the frontend
pnpm --filter web test       # Unit tests
pnpm --filter web test:e2e   # E2E tests (Playwright)
pnpm --filter api seed       # Seed: test user + favorites
pnpm lint                    # Lint the entire monorepo
pnpm typecheck               # Typecheck the entire monorepo
```

---

## License

Project developed as a technical challenge. For evaluation purposes only.
