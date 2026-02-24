# CryptoBoard

Fullstack cryptocurrency dashboard — **Vue 3 + Fastify + MongoDB + TypeScript**.

> Technical challenge for Erictel.

**Cloud Run (Web):** [cryptoboard-web-577076650590.us-central1.run.app](https://cryptoboard-web-577076650590.us-central1.run.app)
**Cloud Run (API):** [cryptoboard-api-577076650590.us-central1.run.app](https://cryptoboard-api-577076650590.us-central1.run.app)
**Cloud Run (API Docs):** [cryptoboard-api-577076650590.us-central1.run.app/docs](https://cryptoboard-api-577076650590.us-central1.run.app/docs)

---

## Stack

| Layer    | Technology                                                          |
| -------- | ------------------------------------------------------------------- |
| Frontend | Vue 3, Vite, Tailwind CSS 4, Reka UI, vue-i18n                      |
| Backend  | Fastify, Mongoose, Zod                                              |
| Database | MongoDB (Atlas M0)                                                  |
| Storage  | MinIO (local) / Cloudflare R2 (prod) — S3-compatible                |
| Tests    | Vitest, Playwright, node:test                                       |
| CI       | GitHub Actions (lint → typecheck → format → build → coverage → e2e) |
| Infra    | Docker Compose, GCP Cloud Run                                       |
| External | [CoinPaprika](https://api.coinpaprika.com/) (free)                  |

---

## Features

- **Auth** — Register, login, forgot/reset password, logout
- **Onboarding** — Post-signup flow for avatar, preferred currency, and description
- **Profile** — Edit name, email, description, avatar, preferred currency
- **Crypto catalog** — Search, filter (coin/token), sorting, pagination, detail view
- **Favorites** — Add/remove, dedicated list with live prices
- **i18n** — Spanish (default), English, Portuguese
- **Security** — Helmet, rate limiting, HttpOnly refresh cookie, same-origin proxy
- **API docs** — Swagger UI at `/docs`
- **Responsive** — Mobile-first, dark mode, loading/error states

---

## Security Highlights

- **Session model:** short-lived access token in memory + rotated refresh token in `HttpOnly` cookie (`SameSite=Strict`)
- **Password reset:** random token sent by email, only SHA-256 hash persisted, token invalidated after first use
- **Enumeration resistance:** forgot-password always returns the same message for existing/non-existing email
- **Hardening:** Helmet headers, route-specific rate limits, timing-safe token hash comparison, open-redirect guard
- **Architecture control:** same-origin `nginx` proxy for web -> API to avoid CORS/CSRF exposure in the challenge setup
- **Secrets hygiene:** no production secrets committed; CI injects an ephemeral `JWT_SECRET` and uses non-sensitive defaults for email sender

Implementation details and tradeoffs are documented in [`NOTES.md`](NOTES.md).

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
pnpm --filter api test        # API integration tests (auth, crypto, favorites, security)
pnpm --filter web test        # Frontend unit tests
pnpm --filter web test:e2e    # E2E — Playwright (routing, auth, and authenticated journey)
pnpm --filter web test:e2e:real # E2E smoke with real Docker API/DB
pnpm --filter api test:coverage
pnpm --filter web test:coverage
pnpm --filter api seed        # Seed test user + favorites
pnpm lint                     # Lint monorepo
pnpm typecheck                # Typecheck monorepo
pnpm format                   # Prettier check
```

---

## API Routes

17 endpoints — full docs at Swagger UI (`/docs`).

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
