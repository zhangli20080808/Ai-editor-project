# Docker 部署细节

本文对应仓库的 `docker-compose.prod.yml` 与 `deploy/dockerfiles/*`。它解释的是当前项目如何部署，而不是一份通用 Docker 教程。

## 1. 服务地图

| Compose 服务 | 项目 | 职责 | 宿主机默认端口 |
| --- | --- | --- | --- |
| `biz-editor-fe` | `apps/biz-editor-fe` | 编辑器用户端 React/Vite 页面，由 Nginx 托管 | 8080 |
| `biz-editor-server` | `apps/biz-editor-server` | 编辑器、作品、模板、用户等 NestJS API | 7001 |
| `h5-server` | `apps/h5-server` | 已发布 H5 的 Next.js SSR 展示端 | 7002 |
| `admin-fe` | `apps/admin-fe` | 运营管理后台 React/Vite 页面，由 Nginx 托管 | 8081 |
| `admin-server` | `apps/admin-server` | 用户、作品和模板治理 API | 7003 |
| `mongo` | MongoDB 7 镜像 | 业务数据存储 | 不对宿主机暴露 |

Docker Compose 会为这些服务创建一个内部网络。服务名就是内部 DNS 名称，例如：

```text
biz-editor-server -> mongodb://mongo:27017/ai_editor
h5-server         -> http://biz-editor-server:7001/api
```

这两个地址只在容器网络中有效。浏览器使用的地址由 `.env.deploy` 中的 `*_PUBLIC_BASE_URL` 配置。

## 2. 每个项目怎样构建为镜像

Dockerfile 位于 `deploy/dockerfiles/`，每个应用独立构建：

```text
biz-editor-fe.Dockerfile       admin-fe.Dockerfile
biz-editor-server.Dockerfile   admin-server.Dockerfile
h5-server.Dockerfile
```

前端 Dockerfile 使用多阶段构建：第一阶段安装完整依赖并执行 `pnpm build`，第二阶段使用 Nginx，只复制构建后的静态文件。这让最终镜像不含源码和开发依赖。

两个 NestJS API 也使用多阶段构建：构建阶段执行 `nest build`，运行阶段安装生产依赖并复制 `dist`，最后以 `node dist/main.js` 启动。H5 服务同样先执行 Next.js 构建，再运行其生产产物。

每个 Compose 服务通过下列字段把项目和 Dockerfile 对应起来：

```yaml
biz-editor-server:
  build:
    context: .
    dockerfile: deploy/dockerfiles/biz-editor-server.Dockerfile
```

`context: .` 的意思是整个 monorepo 都可被 Dockerfile 使用，因此 API 可以同时复制应用自身和 `packages/editor-schema` 等共享包。

## 3. Compose 如何编排

`docker-compose.prod.yml` 负责四件事：

1. 构建镜像并为浏览器服务配置端口映射。
2. 用 `depends_on` 与 healthcheck 控制启动顺序。
3. 向运行中的容器注入环境变量。
4. 创建 Mongo 的命名 volume，保存数据库文件。

启动顺序是：Mongo 先启动并通过 `mongosh ping` 健康检查；两个 API 等待 Mongo healthy；H5 等待业务 API healthy；两个前端等 API 已启动。健康检查并不是“部署成功”的唯一标准，但能防止服务在依赖尚不可用时过早启动。

## 4. 环境变量

先创建私有配置文件：

```bash
cp .env.deploy.example .env.deploy
```

必须在 `.env.deploy` 中修改的内容：

```bash
FE_PUBLIC_BASE_URL=https://editor.example.com
API_PUBLIC_BASE_URL=https://api.example.com
H5_PUBLIC_BASE_URL=https://h5.example.com
ADMIN_FE_PUBLIC_BASE_URL=https://admin.example.com
ADMIN_API_PUBLIC_BASE_URL=https://admin-api.example.com
AUTH_SECRET=替换成足够长的随机字符串
```

`VITE_*` 和 `NEXT_PUBLIC_*` 是构建时变量，会打进浏览器代码。改变公开域名后必须重新构建镜像。`MONGODB_URI`、`AUTH_SECRET`、`MOCK_SMS_CODE`、`PORT` 是运行时变量，容器重建时读取。

Mongo 的默认连接为 `mongodb://mongo:27017/ai_editor`。不要将 Mongo 端口重新映射到宿主机；目前只有同一 Compose 网络中的 API 容器能够访问它。

### AI 页面生成模型

AI Agent 由 `biz-editor-server` 通过 OpenAI 兼容的 Chat Completions 接口调用模型。配置只放在服务器的 `.env.deploy`：

```bash
LLM_API_BASE_URL=https://api.deepseek.com
LLM_API_KEY=你的服务端密钥
LLM_MODEL=deepseek-v4-flash
```

`LLM_API_BASE_URL` 填供应商的兼容 API 根路径，例如 DeepSeek 使用 `https://api.deepseek.com`，OpenAI 使用 `https://api.openai.com/v1`。该 Key 只会注入 API 容器，前端不会读取、打包或返回该值。未配置时，编辑器仍可正常使用；AI 抽屉会返回明确的配置提示，不会降级为伪造结果。为控制成本，首期每次生成最多进行三轮模型/工具交互，且只保留当前用户最近 20 条创作记录。

## 5. 首次启动

在项目根目录执行：

```bash
pnpm deploy:build
pnpm deploy:up
docker compose --env-file .env.deploy -f docker-compose.prod.yml exec \
  biz-editor-server node apps/biz-editor-server/dist/scripts/seed-demo-content.js
```

最后一条会初始化演示账号 `13800138000`、6 份作品和 6 份公开模板。验证码为 `.env.deploy` 中的 `MOCK_SMS_CODE`，默认是 `123456`。初始化脚本可重复运行，固定演示标题不会重复创建。

检查状态：

```bash
docker compose --env-file .env.deploy -f docker-compose.prod.yml ps
curl http://localhost:7001/api/health
```

## 6. 日常运维

```bash
pnpm deploy:build  # 代码或前端公开地址变化后重建镜像
pnpm deploy:up     # 后台启动或按新镜像重建
pnpm deploy:logs   # 持续查看所有服务日志
pnpm deploy:down   # 停止并移除容器、网络
```

普通的 `pnpm deploy:down` 不会删除 `ai-editor-prod-mongo-data` volume，下一次启动会恢复原数据。只有显式执行带 `-v` 的 Compose down 才会删除数据卷，生产环境执行前必须备份。

## 7. 云主机入口

Compose 负责容器内应用，不负责 TLS 证书和域名入口。单台云主机可在宿主机放置 Nginx 或 Caddy：它接收 80/443，根据域名代理到 `8080`、`7001`、`7002`、`8081`、`7003`。线上应让这些应用端口仅绑定到内网或回环地址，由反向代理统一对公网暴露 HTTPS。

## 8. 排错顺序

1. `pnpm deploy:logs` 查看日志，先确认 Mongo healthy，再看 API。
2. 页面能打开但 API 请求失败时，检查 `API_PUBLIC_BASE_URL` 是否为浏览器可达地址；修改后重建前端镜像。
3. 端口冲突时，修改 `.env.deploy` 中的 `FE_PORT`、`API_PORT` 等宿主机端口；容器内部端口不变。
4. 需要查看 Mongo 时使用 `docker compose exec mongo mongosh`，不要为方便调试公开 27017。
