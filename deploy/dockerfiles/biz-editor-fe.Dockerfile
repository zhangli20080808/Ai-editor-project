FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:7001/api
ARG VITE_H5_BASE_URL=http://localhost:7002
ARG VITE_ADMIN_FE_BASE_URL=http://localhost:7004
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_H5_BASE_URL=$VITE_H5_BASE_URL
ENV VITE_ADMIN_FE_BASE_URL=$VITE_ADMIN_FE_BASE_URL

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/admin-fe/package.json apps/admin-fe/package.json
COPY apps/biz-editor-fe/package.json apps/biz-editor-fe/package.json
COPY apps/admin-server/package.json apps/admin-server/package.json
COPY apps/biz-editor-server/package.json apps/biz-editor-server/package.json
COPY apps/h5-server/package.json apps/h5-server/package.json
COPY packages/biz-components/package.json packages/biz-components/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json

RUN pnpm install --frozen-lockfile

COPY apps/biz-editor-fe apps/biz-editor-fe
COPY packages/biz-components packages/biz-components
COPY packages/editor-schema packages/editor-schema

RUN pnpm --filter @zhangli2008/ai-editor-components build
RUN pnpm --filter biz-editor-fe build

FROM nginx:1.27-alpine AS runner

COPY deploy/nginx/biz-editor-fe.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/biz-editor-fe/dist /usr/share/nginx/html

EXPOSE 80
