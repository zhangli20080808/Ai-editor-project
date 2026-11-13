FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/admin-fe/package.json apps/admin-fe/package.json
COPY apps/admin-server/package.json apps/admin-server/package.json
COPY apps/biz-editor-server/package.json apps/biz-editor-server/package.json
COPY apps/biz-editor-fe/package.json apps/biz-editor-fe/package.json
COPY apps/h5-server/package.json apps/h5-server/package.json
COPY packages/biz-components/package.json packages/biz-components/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json

RUN pnpm install --frozen-lockfile

COPY apps/admin-server apps/admin-server
COPY packages/editor-schema packages/editor-schema

RUN pnpm --filter admin-server build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-fe/package.json apps/admin-fe/package.json
COPY apps/admin-server/package.json apps/admin-server/package.json
COPY apps/biz-editor-server/package.json apps/biz-editor-server/package.json
COPY apps/biz-editor-fe/package.json apps/biz-editor-fe/package.json
COPY apps/h5-server/package.json apps/h5-server/package.json
COPY packages/biz-components/package.json packages/biz-components/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json

RUN pnpm install --prod --frozen-lockfile --filter admin-server

COPY --from=builder /app/apps/admin-server/dist apps/admin-server/dist

EXPOSE 7003

CMD ["node", "apps/admin-server/dist/main.js"]
