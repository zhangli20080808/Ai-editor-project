# 部署方案

本项目的一期部署采用 Docker Compose，适合本地模拟生产环境、云主机和后续 CI/CD 发布。

## 服务组成

| 服务 | 说明 | 默认端口 |
| --- | --- | --- |
| `biz-editor-fe` | B 端 React/Vite 静态站点，Nginx 托管 | `8080` |
| `biz-editor-server` | NestJS API 服务 | `7001` |
| `h5-server` | Next.js H5 SSR 展示端 | `7002` |
| `admin-fe` | 管理后台 React/Vite 静态站点，Nginx 托管 | `8081` |
| `admin-server` | 管理后台治理 API 服务 | `7003` |
| `mongo` | MongoDB 数据库 | `27017` |

## 第一次启动

```bash
cp .env.deploy.example .env.deploy
pnpm deploy:build
pnpm deploy:up
docker compose --env-file .env.deploy -f docker-compose.prod.yml exec biz-editor-server node apps/biz-editor-server/dist/scripts/seed-demo-content.js
```

启动后访问：

- B 端：http://localhost:8080
- 管理后台：http://localhost:8081
- API 健康检查：http://localhost:7001/api/health
- Mongo 健康检查：http://localhost:7001/api/health/mongo
- H5 示例地址：http://localhost:7002/p/:uuid
- Admin API 健康检查：http://localhost:7003/api/health

第三条命令会创建演示账号 `13800138000` 及六份作品、六份公开模板；可重复执行，不会产生重复内容。登录验证码使用 `.env.deploy` 中的 `MOCK_SMS_CODE`。

## 常用命令

```bash
pnpm deploy:up      # 后台启动
pnpm deploy:logs    # 查看日志
pnpm deploy:down    # 停止服务
pnpm deploy:build   # 重新构建镜像
```

## 生产环境变量

`.env.deploy` 中最重要的是这几个地址：

```bash
API_PUBLIC_BASE_URL=https://api.example.com
H5_PUBLIC_BASE_URL=https://h5.example.com
FE_PUBLIC_BASE_URL=https://editor.example.com
ADMIN_FE_PUBLIC_BASE_URL=https://admin.example.com
ADMIN_API_PUBLIC_BASE_URL=https://admin-api.example.com
```

注意：

- `VITE_*` 和 `NEXT_PUBLIC_*` 类型变量会在镜像构建时写入前端产物。
- 如果域名变化，需要重新执行 `pnpm deploy:build && pnpm deploy:up`。
- `AUTH_SECRET` 必须替换成足够长的随机字符串。
- `MONGODB_URI` 在 Compose 内部默认使用 `mongodb://mongo:27017/ai_editor`。
- MongoDB 不映射到宿主机端口，只允许 API 容器通过 Docker 内部网络访问。
- AI 页面生成使用 OpenAI 兼容 Chat Completions 接口：在 `.env.deploy` 设置 `LLM_API_BASE_URL`、`LLM_API_KEY` 和 `LLM_MODEL`。密钥只注入 `biz-editor-server`，不会进入前端镜像或浏览器请求。

## 推荐线上拓扑

```text
用户浏览器
  ├─ editor.example.com -> biz-editor-fe
  ├─ api.example.com    -> biz-editor-server
  ├─ h5.example.com     -> h5-server
  ├─ admin.example.com  -> admin-fe
  └─ admin-api.example.com -> admin-server
```

如果只有一台云主机，可以在宿主机再放一层 Nginx/Caddy 做 HTTPS 和域名转发：

```text
80/443
  ├─ editor.example.com -> 127.0.0.1:8080
  ├─ api.example.com    -> 127.0.0.1:7001
  ├─ h5.example.com     -> 127.0.0.1:7002
  ├─ admin.example.com  -> 127.0.0.1:8081
  └─ admin-api.example.com -> 127.0.0.1:7003
```

## 数据持久化

MongoDB 数据保存在 Docker volume：

```text
ai-editor-prod-mongo-data
```

停止服务不会删除数据。只有执行带 `-v` 的 compose down 才会清空 volume。

## 当前边界

- 一期部署不包含 HTTPS 证书自动签发。
- 一期不做对象存储，封面图和上传能力仍按当前 URL/本地预览链路。
- 一期不做多副本和滚动发布。
- 后续可以继续接 GitHub Actions，在 main 分支构建镜像并发布到云主机或镜像仓库。
