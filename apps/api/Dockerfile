# ── builder ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/shared packages/shared

RUN pnpm --filter @crypto/shared build && pnpm --filter api build

# ── runtime ──────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json apps/api/package.json
COPY --from=builder /app/packages/shared/package.json packages/shared/package.json

RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist

USER app

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]
