# CryptoBoard

Fullstack cryptocurrency dashboard — **Vue 3 + Fastify + MongoDB + TypeScript**.

> Technical challenge for Erictel.

**Live demo:** [cryptoboard-web-577076650590.us-central1.run.app](https://cryptoboard-web-577076650590.us-central1.run.app)

---

## Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | Vue 3, Vite, Tailwind CSS 4, shadcn-vue, vue-i18n    |
| Backend  | Fastify, Mongoose, Zod                               |
| Database | MongoDB (Atlas M0)                                   |
| Storage  | MinIO (local) / Cloudflare R2 (prod) — S3-compatible |
| Tests    | Vitest, Playwright, node:test                        |
| CI       | GitHub Actions (lint → typecheck → test → build)     |
| Infra    | Docker Compose, GCP Cloud Run                        |
| External | [CoinPaprika](https://api.coinpaprika.com/) (free)   |

---

## Features

- **Auth** — Register, login, forgot/reset password, logout
- **Profile** — Edit name, email, description, avatar, preferred currency
- **Crypto catalog** — Search, filter (coin/token), sorting, pagination, detail view
- **Favorites** — Add/remove, dedicated list with live prices
- **i18n** — Spanish (default), English, Portuguese
- **Security** — Helmet, rate limiting, HttpOnly refresh cookie, same-origin proxy
- **API docs** — Swagger UI at `/docs`
- **Responsive** — Mobile-first, dark mode, loading/error states

---

## Quick Start

```bash
git clone https://github.com/tavaresgmg/cryptoboard.git
cd cryptoboard
cp .env.example .env
docker-compose up --build   # api :3000, web :8080, mongo :27017, minio :9000
```

Seed a test user and try immediately:

```bash
docker exec -it $(docker ps -qf name=api) node apps/api/dist/seed.js
# login: seed@crypto.dev / Seed1234
```

Or run without Docker (requires local MongoDB):

```bash
pnpm install
pnpm --filter api dev    # http://localhost:3000 (Swagger at /docs)
pnpm --filter web dev    # http://localhost:5173
```

---

## Scripts

```bash
pnpm --filter api test        # API integration tests (8)
pnpm --filter web test        # Frontend unit tests (14)
pnpm --filter web test:e2e    # E2E — Playwright (16)
pnpm --filter api seed        # Seed test user + favorites
pnpm lint                     # Lint monorepo
pnpm typecheck                # Typecheck monorepo
```

---

## API Routes

16 endpoints — full docs at Swagger UI (`/docs`).

| Method | Route                         | Description               | Auth   |
| ------ | ----------------------------- | ------------------------- | ------ |
| POST   | `/auth/register`              | Create user               | No     |
| POST   | `/auth/login`                 | Login                     | No     |
| POST   | `/auth/refresh`               | Renew access token        | Cookie |
| DELETE | `/auth/logout`                | Logout                    | Yes    |
| POST   | `/auth/forgot-password`       | Send reset email          | No     |
| POST   | `/auth/reset-password`        | Reset password with token | No     |
| GET    | `/users/me`                   | Get profile               | Yes    |
| PUT    | `/users/me`                   | Update profile            | Yes    |
| PUT    | `/users/me/avatar`            | Upload avatar             | Yes    |
| GET    | `/users/me/avatar-url`        | Get avatar signed URL     | Yes    |
| GET    | `/users/me/avatar`            | Get avatar (presigned)    | Yes    |
| POST   | `/users/me/favorites/:coinId` | Add favorite              | Yes    |
| DELETE | `/users/me/favorites/:coinId` | Remove favorite           | Yes    |
| GET    | `/users/me/favorites`         | List favorites            | Yes    |
| GET    | `/crypto`                     | List cryptocurrencies     | Yes    |
| GET    | `/crypto/:id`                 | Crypto details            | Yes    |
| GET    | `/health`                     | Health check              | No     |

---

## Project Structure

```text
├── apps/
│   ├── api/          # Fastify backend
│   └── web/          # Vue 3 frontend
├── packages/
│   └── shared/       # Zod schemas shared between front and back
└── docker-compose.yml
```

---

## Production

| Service   | Provider         | Tier |
| --------- | ---------------- | ---- |
| API + Web | GCP Cloud Run    | Free |
| Database  | MongoDB Atlas M0 | Free |
| Storage   | Cloudflare R2    | Free |
| Email     | Resend           | Free |

Nginx in the web container proxies `/api/*` to the API service (same-origin — cookies work with `SameSite=Strict`, no CORS/CSRF needed).

---

Tradeoffs, security posture, and honest self-assessment: [`NOTES.md`](NOTES.md).
