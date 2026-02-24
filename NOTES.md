# Engineering Notes

> Tradeoffs, security posture, and honest self-assessment for the evaluator.
> Stack, features, and setup instructions are in [README.md](README.md).

---

## Key Tradeoffs

| Decision                    | Why                                                   | Gave up                                       |
| --------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| Fastify over Express        | Faster, native schema validation, TS-first            | Smaller middleware ecosystem                  |
| shadcn-vue over Vuetify     | Own the code, zero vendor lock-in, Reka UI a11y       | Fewer ready-made components                   |
| MongoDB over PostgreSQL     | Valued in the evaluation, flexible schema, free Atlas  | No multi-document ACID                        |
| Composables over Pinia      | YAGNI — module-level refs work at this scale          | Devtools integration, formal store pattern    |
| HttpOnly cookie for refresh | Immune to XSS (unlike localStorage)                   | Slightly more complex CORS setup              |
| In-memory cache over Redis  | Zero extra dependency, sufficient for 1 instance      | Doesn't survive restart or scale horizontally |
| Layered arch over Clean/Hex | Simple, testable, predictable for 3 modules           | Less flexibility to swap DB/framework         |
| Single User collection      | All data fits one document, no joins needed            | No multi-device sessions                      |
| Same-origin proxy (nginx)   | Eliminates CORS and CSRF entirely                     | Extra proxy hop (~1ms)                        |

---

## Security

**Implemented:**

- JWT access (15min, in-memory) + refresh (7d, HttpOnly cookie, rotation)
- Timing-safe comparison for all token hashes
- Rate limiting per-route (10/min login, 5/min forgot-password)
- Helmet headers, scrypt password hashing
- Open-redirect protection on login callback
- JWT secret rejected in production if using default value
- Reset tokens stored as SHA-256 hash

**Would add with more time:**

- CSRF double-submit cookie (mitigated by SameSite + same-origin proxy)
- Password strength validation (zxcvbn)
- Audit log for sensitive actions

---

## What I'd Do Differently

**With more time:** Redis for shared cache, cursor-based pagination, image compression on upload (sharp), separate RefreshToken collection, contract tests, Storybook, OpenTelemetry.

**If starting over:** Pinia if growing beyond 5-6 views, PostgreSQL if complex relationships existed, Nuxt SSR if SEO mattered.

---

## Honest Assessment

**Strongest:**

- Complete auth flow (register → login → refresh rotation → logout → forgot → reset)
- Security depth for a challenge (timing-safe, rate limit, helmet, token hashing, open-redirect)
- Shared Zod schemas — same validation front and back, zero type drift
- CI pipeline: GitHub Actions runs lint → typecheck → 38 tests on every push
- DX: 1 command to run everything (docker-compose), seed script, Swagger docs

**Weakest:**

- E2E covers UI structure only (no real API in Playwright — would need test DB in CI)
- No cache invalidation strategy — in-memory cache TTL only, no event-based refresh
- CoinPaprika free tier has rate limits — production would need paid API or aggressive caching
