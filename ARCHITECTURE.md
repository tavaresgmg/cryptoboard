# ARCHITECTURE.md

## Contexto
Projeto em formato monorepo com `pnpm workspaces` para separar responsabilidades de `api`, `web` e `shared`, mantendo contratos versionados no mesmo repositorio.

## Estrutura
```
/
|-- apps/
|   |-- api/        # Backend (Fastify + TypeScript)
|   `-- web/        # Frontend (Vue 3 + Vite + TypeScript)
|-- packages/
|   `-- shared/     # Tipos e schemas Zod compartilhados
|-- docs/           # Documentacao funcional e tecnica
`-- package.json    # Scripts e dependencias de tooling
```

## Fronteiras
- `apps/api`: nao depende de `apps/web`.
- `apps/web`: nao depende de `apps/api` diretamente, apenas por HTTP e contratos compartilhados.
- `packages/shared`: sem dependencias de runtime das apps; somente utilitarios/tipos compartilhaveis.

## Decisoes Base
- Monorepo para reduzir friccao de setup e sincronizacao de contratos.
- TypeScript estrito como baseline de corretude.
- ESLint + Prettier para consistencia.
- API com Fastify + Swagger em `/docs`, health em `/health` e fluxo de auth JWT.
- API reforcada com `helmet` e `rate-limit`, upload multipart e storage S3-compativel.
- Persistencia de usuarios em MongoDB via Mongoose.
- Frontend com Vue 3 + Vite + Vue Router + `vue-i18n` (ES/EN/PT-BR).
- UI com Tailwind CSS 4 e componentes no padrao `shadcn-vue` (base `Button` + utilitarios CVA).
- Contratos centralizados em `packages/shared/src/schemas` com Zod.
- Execucao local containerizada via Dockerfiles e `docker-compose.yml`.
- Testes de integracao da API com `node:test` + `tsx` + `mongodb-memory-server`, exercitando rotas via `fastify.inject`.
- Testes do frontend com `Vitest` cobrindo `auth-client` e guard de rotas.
- E2E com Playwright (`apps/web/e2e`).
- Pipeline de CI em `.github/workflows/ci.yml` com gates de lint, typecheck, build, testes e E2E.

## Estado Atual
- `apps/api`:
  - `src/index.ts`: bootstrap do servidor
  - `src/server.ts`: composicao da API + error handler global
  - `src/plugins/`: CORS, auth (`@fastify/jwt` + cookie), segurança (`helmet` + `rate-limit`), upload multipart e Swagger
  - `src/modules/health/health.routes.ts`: rota de health
  - `src/modules/auth/*`: register/login/refresh/logout + forgot/reset password + guard JWT
  - `src/modules/user/*`: `/users/me`, update perfil, favoritos e avatar
  - `src/modules/crypto/*`: catalogo + detalhe de criptomoedas
  - `src/modules/user/user.model.ts`: schema Mongoose do usuario
  - `src/services/storage.service.ts`: upload + URL assinada em S3/MinIO
  - `src/services/email.service.ts`: envio de email de reset (Resend, quando configurado)
  - `src/scripts/seed.ts`: seed local de usuario demo
- `apps/web`:
  - `index.html`, `vite.config.ts`
  - `src/router/index.ts`: guard de rotas com refresh automatico
  - `src/services/auth-client.ts`: cliente HTTP com token em memoria + perfil/avatar + forgot/reset
  - `src/i18n.ts`: internacionalizacao (ES default, EN, PT-BR)
  - `src/components/ui/*`: componentes base no padrao shadcn-vue
  - `src/views/LoginView.vue`, `RegisterView.vue`, `DashboardView.vue`, `ForgotPasswordView.vue`, `ResetPasswordView.vue`
  - `src/main.ts` e `src/styles.css`
  - `e2e/*` + `playwright.config.ts`: E2E
- `packages/shared`:
  - `src/schemas/auth.ts`, `user.ts`, `crypto.ts`, `common.ts`
  - tipos derivados via `z.infer`
- Docker:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `apps/web/nginx.conf` (proxy `/api` same-origin)
  - `docker-compose.yml`
  - servicos: `api`, `web`, `mongo`, `minio`

## Operacao
- Install: `pnpm install`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Teste API: `pnpm --filter api test`
- Teste Web: `pnpm --filter web test`
- Teste E2E: `pnpm --filter web test:e2e`
- Seed API: `pnpm --filter api seed`
