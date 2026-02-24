# Engineering Notes

> Context, tradeoffs, and honest self-assessment for the evaluator.
> Stack, features, and setup are in [README.md](README.md). This document covers the _why_.

---

## Approach

The goal was not to impress with complexity — it was to show **sound engineering judgment**: justified choices, clean code, predictable architecture, and the ability to deliver quality under real constraints.

Every decision followed one principle: **solve the problem in the simplest way that is still correct, secure, and maintainable**.

---

## Key Tradeoffs

| Decision                          | Why                                                      | What I gave up                                               |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| Fastify over Express              | Faster, native schema validation, TS-first               | Smaller middleware ecosystem (irrelevant for this scope)     |
| shadcn-vue over Vuetify           | You own the code, zero vendor lock-in, Reka UI a11y      | Fewer ready-made components (sufficient here)                |
| MongoDB over PostgreSQL           | Valued in the evaluation, flexible schema, free Atlas M0 | No multi-document ACID (not needed)                          |
| Composables over Pinia            | YAGNI — module-level refs work for this scale            | Devtools integration, formal store pattern                   |
| HttpOnly cookie for refresh       | Immune to XSS (unlike localStorage)                      | Slightly more complex setup (CORS credentials, cookie flags) |
| In-memory cache over Redis        | Zero extra dependency, sufficient for 1 instance         | Doesn't survive restart, doesn't scale horizontally          |
| Layered arch over Clean/Hexagonal | Simple, testable, predictable for 3 modules              | Less flexibility to swap DB or framework (not needed)        |
| Single User collection            | All data fits one document, no joins needed              | No multi-device sessions (1 refresh token per user)          |
| Proxy same-origin (nginx)         | Eliminates CORS and CSRF entirely                        | Extra proxy hop (~1ms, negligible)                           |

---

## Security Posture

What's implemented:

- JWT access (15min, in-memory) + refresh (7d, HttpOnly cookie, rotation)
- Timing-safe comparison for all token hashes
- Rate limiting per-route (10/min login, 5/min forgot-password)
- Helmet security headers, password hashing with scrypt
- Open-redirect protection on login callback
- JWT secret rejected in production if using default value
- Reset tokens stored as SHA-256 hash (useless if DB leaks)

What I'd add with more time:

- CSRF double-submit cookie (currently mitigated by SameSite + same-origin proxy)
- Password strength validation (zxcvbn)
- Audit log for sensitive actions (login, email/password change)

---

## What I'd Do Differently

**With more time:**

- Redis for shared cache across instances
- Cursor-based pagination instead of offset
- Image compression on upload (sharp) before S3
- Separate RefreshToken collection for multi-device support
- Contract tests (consumer-driven)
- Storybook for isolated component development
- OpenTelemetry for distributed tracing

**If starting over:**

- Pinia if the app were growing beyond 5-6 views (formal store pattern pays off at scale)
- PostgreSQL if the domain had complex relationships (joins, transactions)
- SSR with Nuxt if SEO mattered (it doesn't for an authenticated dashboard)

---

## Honest Assessment

**Strongest points:**

- Auth flow completeness (register, login, refresh rotation, logout, forgot, reset)
- Security depth for a technical challenge (timing-safe, rate limit, helmet, token hashing, open-redirect protection)
- Monorepo with shared Zod schemas — same validation front and back, zero type drift
- DX: 1 clone, 1 install, docker-compose up, seed script, structured logging

**Weakest points:**

- E2E tests cover UI structure only (no real API in Playwright — would need test DB + API server in CI)
- No real-time updates (WebSocket for live prices would be a nice touch)
- CoinPaprika free tier has rate limits — production would need a paid API or aggressive caching

---
