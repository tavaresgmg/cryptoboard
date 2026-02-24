FROM node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/shared packages/shared

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @crypto/shared build && pnpm --filter web build

FROM nginx:1.27-alpine

COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/templates/default.conf.template

ENV PORT=80
ENV API_PROXY_TARGET=http://api:3000

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${PORT} ${API_PROXY_TARGET}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
