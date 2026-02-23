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
- Persistencia de usuarios em MongoDB via Mongoose.
- Frontend com Vue 3 + Vite + Vue Router, incluindo rotas publicas e protegidas.
- Contratos centralizados em `packages/shared/src/schemas` com Zod.
- Execucao local containerizada via Dockerfiles e `docker-compose.yml`.
- Testes de integracao da API com `node:test` + `tsx` + `mongodb-memory-server`, exercitando rotas via `fastify.inject`.
- Testes do frontend com `Vitest` focando o `auth-client` e fluxo de sessao/refresh.
- Pipeline de CI em `.github/workflows/ci.yml` com gates de lint, typecheck, build e testes.

## Estado Atual
- `apps/api`:
  - `src/index.ts`: bootstrap do servidor
  - `src/server.ts`: composicao da API + error handler global
  - `src/plugins/`: CORS, auth (`@fastify/jwt` + cookie) e Swagger
  - `src/modules/health/health.routes.ts`: rota de health
  - `src/modules/auth/*`: register/login/refresh/logout + guard JWT
  - `src/modules/user/*`: `/users/me` protegido
  - `src/modules/user/user.model.ts`: schema Mongoose do usuario
- `apps/web`:
  - `index.html`, `vite.config.ts`
  - `src/router/index.ts`: guard de rotas com refresh automatico
  - `src/services/auth-client.ts`: cliente HTTP com token em memoria
  - `src/views/LoginView.vue`, `RegisterView.vue`, `DashboardView.vue`
  - `src/main.ts` e `src/styles.css`
- `packages/shared`:
  - `src/schemas/auth.ts`, `user.ts`, `crypto.ts`, `common.ts`
  - tipos derivados via `z.infer`
- Docker:
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `docker-compose.yml`

## Operacao
- Install: `pnpm install`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`
- Teste API: `pnpm --filter api test`
- Teste Web: `pnpm --filter web test`
