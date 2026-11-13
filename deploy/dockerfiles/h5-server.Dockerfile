FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_H5_API_BASE_URL=http://localhost:7001/api
ENV NEXT_PUBLIC_H5_API_BASE_URL=$NEXT_PUBLIC_H5_API_BASE_URL

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/admin-fe/package.json apps/admin-fe/package.json
COPY apps/h5-server/package.json apps/h5-server/package.json
COPY apps/admin-server/package.json apps/admin-server/package.json
COPY apps/biz-editor-fe/package.json apps/biz-editor-fe/package.json
COPY apps/biz-editor-server/package.json apps/biz-editor-server/package.json
COPY packages/biz-components/package.json packages/biz-components/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json

RUN pnpm install --frozen-lockfile

COPY apps/h5-server apps/h5-server
COPY packages/biz-components packages/biz-components
COPY packages/editor-schema packages/editor-schema

RUN pnpm --filter @zhangli2008/ai-editor-components build
RUN pnpm --filter h5-server build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=7002

COPY --from=builder /app/apps/h5-server/.next/standalone ./
COPY --from=builder /app/apps/h5-server/.next/static apps/h5-server/.next/static

EXPOSE 7002

CMD ["node", "apps/h5-server/server.js"]
