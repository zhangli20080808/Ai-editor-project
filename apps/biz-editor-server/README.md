# biz-editor-server

B 端作品后台 API 服务，使用 NestJS + Mongoose + MongoDB。

## Scripts

```bash
npx pnpm@10.0.0 --filter biz-editor-server dev
npx pnpm@10.0.0 --filter biz-editor-server typecheck
npx pnpm@10.0.0 --filter biz-editor-server build
```

## Environment

复制 `.env.example` 为 `.env`，按需修改 MongoDB 地址：

```bash
PORT=7001
MONGODB_URI=mongodb://127.0.0.1:27017/ai_editor
```

## Health Check

MongoDB 启动后，服务可访问：

```txt
GET /api/health
GET /api/health/mongo
```

## Local MongoDB

```bash
docker run -d \
  --name ai-editor-mongo \
  -p 27017:27017 \
  -v ai-editor-mongo-data:/data/db \
  mongo:7
```

如果容器已经存在：

```bash
docker start ai-editor-mongo
```

## Works API

```txt
POST   /api/works
GET    /api/works
GET    /api/works/:id
PATCH  /api/works/:id
POST   /api/works/:id/publish
POST   /api/works/:id/copy
DELETE /api/works/:id
POST   /api/works/:id/restore
```

`id` 同时支持 MongoDB `_id` 和作品 `uuid`。一期暂不接登录，作品作者使用 mock 用户。
