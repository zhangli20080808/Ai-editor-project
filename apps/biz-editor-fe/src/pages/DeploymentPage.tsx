import { Card, Tag, Typography } from 'antd'
import { Boxes, Database, Network, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'

const { Paragraph, Text, Title } = Typography

const services = [
  ['biz-editor-fe', 'React + Vite 前端', 'Nginx 静态托管', '8080'],
  ['biz-editor-server', '业务 API', 'NestJS / Node.js', '7001'],
  ['h5-server', 'H5 展示与访问页', 'Next.js SSR', '7002'],
  ['admin-fe', '运营管理后台', 'Nginx 静态托管', '8081'],
  ['admin-server', '后台治理 API', 'NestJS / Node.js', '7003'],
  ['mongo', '业务数据', 'MongoDB 7', '仅 Docker 内部'],
] as const

const sections = [
  { id: 'overview', title: '部署目标与服务地图' },
  { id: 'images', title: '每个项目如何写成镜像' },
  { id: 'compose', title: 'Compose 如何编排到一起' },
  { id: 'environment', title: '环境变量与地址关系' },
  { id: 'first-start', title: '第一次部署的完整步骤' },
  { id: 'update', title: '更新、查看日志与停止' },
  { id: 'data-security', title: '数据持久化与安全边界' },
  { id: 'troubleshooting', title: '常见问题排查' },
] as const

function DeploymentPage() {
  return (
    <main className="workspace-page deployment-page">
      <section className="workspace-page-header deployment-page-header">
        <div>
          <Text type="secondary">Docker Compose Deployment Guide</Text>
          <Title level={3}>部署细节</Title>
          <Paragraph type="secondary">
            这份手册对应当前仓库的实际配置，说明每个项目怎样被做成镜像，以及 Docker Compose 怎样把它们连成可运行的完整产品。
          </Paragraph>
        </div>
        <div className="deployment-summary" aria-label="部署规模">
          <Boxes size={22} />
          <Text strong>5 个应用</Text>
          <Text type="secondary">+ 1 个数据库</Text>
        </div>
      </section>

      <div className="deployment-reader">
        <aside className="notes-outline" aria-label="部署手册目录">
          <Text type="secondary" className="notes-outline-title">部署目录</Text>
          <div className="notes-outline-list">
            {sections.map((section, index) => (
              <a className="notes-outline-item deployment-outline-item" href={`#${section.id}`} key={section.id}>
                <span className="notes-outline-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="notes-outline-text">{section.title}</span>
              </a>
            ))}
          </div>
        </aside>

        <div className="deployment-content">
          <DeploymentSection id="overview" title="部署目标与服务地图">
            <Paragraph>
              Docker 把每个应用和它运行所需的 Node、依赖、构建产物打包成一个独立镜像；Docker Compose 再按 <Text code>docker-compose.prod.yml</Text> 同时启动它们、创建内部网络、等待依赖健康，并保留 Mongo 数据卷。开发电脑和云主机执行的是同一套编排文件。
            </Paragraph>
            <div className="deployment-service-grid">
              {services.map(([name, responsibility, runtime, port]) => (
                <Card key={name} size="small">
                  <Text strong>{name}</Text>
                  <Text type="secondary">{responsibility}</Text>
                  <Text type="secondary">{runtime} · {port}</Text>
                </Card>
              ))}
            </div>
            <CodeBlock>{`浏览器
  ├─ :8080  biz-editor-fe  ────────> biz-editor-server :7001
  ├─ :7002  h5-server      ────────> biz-editor-server :7001
  └─ :8081  admin-fe       ────────> admin-server :7003

biz-editor-server :7001 ─┐
admin-server :7003 ──────┴──────────> mongo :27017（仅容器内部）`}</CodeBlock>
          </DeploymentSection>

          <DeploymentSection id="images" title="每个项目如何写成镜像">
            <Paragraph>
              Dockerfile 位于 <Text code>deploy/dockerfiles</Text>。每个服务各有一个文件，但遵循两种固定模式：前端先构建再交给 Nginx；Node 服务先编译再用 Node 运行编译产物。
            </Paragraph>
            <div className="deployment-two-columns">
              <InfoCard title="前端镜像：biz-editor-fe、admin-fe" icon={<Boxes size={18} />} items={[
                '构建阶段运行 pnpm install 和 pnpm build，得到 Vite 的静态 dist 文件。',
                '运行阶段使用轻量 Nginx 镜像，只复制 dist，不携带源码和开发依赖。',
                'VITE_* 是构建变量，域名或 API 地址变化后必须重新 build 镜像。',
              ]} />
              <InfoCard title="Node 镜像：biz-editor-server、admin-server、h5-server" icon={<Network size={18} />} items={[
                '构建阶段安装完整依赖并执行 Nest build 或 Next build。',
                '运行阶段只安装生产依赖，再复制 dist 或 .next 构建产物。',
                'PORT、MONGODB_URI 等在容器启动时注入，无需每次重新构建。',
              ]} />
            </div>
            <CodeBlock>{`# 以业务 API 为例，Compose 指定构建上下文和 Dockerfile
biz-editor-server:
  build:
    context: .
    dockerfile: deploy/dockerfiles/biz-editor-server.Dockerfile

# Dockerfile 的核心顺序
1. 复制 package.json / pnpm-lock.yaml，安装依赖
2. 复制 apps/biz-editor-server 与共享 packages
3. 执行 pnpm --filter biz-editor-server build
4. 在运行镜像中仅复制 dist，并执行 node dist/main.js`}</CodeBlock>
          </DeploymentSection>

          <DeploymentSection id="compose" title="Compose 如何编排到一起">
            <Paragraph>
              <Text code>docker-compose.prod.yml</Text> 是总装配图。服务名既是 Compose 中的标识，也是同一 Docker 网络内可解析的主机名，因此 API 用 <Text code>mongodb://mongo:27017/ai_editor</Text> 访问数据库，H5 用 <Text code>http://biz-editor-server:7001/api</Text> 访问业务 API，不需要写宿主机 IP。
            </Paragraph>
            <div className="deployment-flow-list">
              <FlowItem step="1" title="先启动 Mongo" description="Mongo 有 healthcheck；只有 mongosh ping 成功才被标记为 healthy。" />
              <FlowItem step="2" title="再启动两个 API" description="biz-editor-server 和 admin-server 使用 depends_on 等待 Mongo healthy，避免服务刚启动就连接空端口。" />
              <FlowItem step="3" title="启动 H5 和两个前端" description="H5 等业务 API 健康，前端等待它们已启动后再提供浏览器入口。" />
              <FlowItem step="4" title="暴露浏览器所需端口" description="Compose 将 8080、7001、7002、8081、7003 映射给宿主机；Mongo 没有 ports，因此不能从公网或本机直连。" />
            </div>
          </DeploymentSection>

          <DeploymentSection id="environment" title="环境变量与地址关系">
            <Paragraph>从 <Text code>.env.deploy.example</Text> 复制出本机或服务器私有的 <Text code>.env.deploy</Text>，不要把后者提交到 Git。域名部署时最重要的是浏览器可访问的五个地址。</Paragraph>
            <CodeBlock>{`FE_PUBLIC_BASE_URL=https://editor.example.com
API_PUBLIC_BASE_URL=https://api.example.com
H5_PUBLIC_BASE_URL=https://h5.example.com
ADMIN_FE_PUBLIC_BASE_URL=https://admin.example.com
ADMIN_API_PUBLIC_BASE_URL=https://admin-api.example.com

MONGODB_URI=mongodb://mongo:27017/ai_editor
AUTH_SECRET=替换为长随机字符串
MOCK_SMS_CODE=123456`}</CodeBlock>
            <div className="deployment-two-columns">
              <InfoCard title="构建时变量" icon={<Boxes size={18} />} items={['VITE_API_BASE_URL、VITE_H5_BASE_URL、VITE_ADMIN_* 会写入前端静态文件。', 'NEXT_PUBLIC_H5_API_BASE_URL 会写入 H5 的浏览器端代码。', '改这些地址后执行 deploy:build 再 deploy:up。']} />
              <InfoCard title="运行时变量" icon={<Network size={18} />} items={['MONGODB_URI、AUTH_SECRET、MOCK_SMS_CODE、PORT 在容器启动时读取。', '仅改运行时变量通常执行 deploy:up 重建容器即可。', 'AUTH_SECRET 是登录令牌签名密钥，线上必须换成随机长字符串。']} />
            </div>
            <InfoCard title="AI 模型变量" icon={<ShieldCheck size={18} />} items={['LLM_API_BASE_URL、LLM_API_KEY、LLM_MODEL 只注入 biz-editor-server。', '接口使用 OpenAI 兼容 Chat Completions 协议，地址应包含 /v1。', '密钥不会进入 Vite 或 Next.js 构建产物；未配置时 AI 抽屉会提示完成服务端配置。']} />
          </DeploymentSection>

          <DeploymentSection id="first-start" title="第一次部署的完整步骤">
            <ol className="deployment-steps">
              <li>安装 Docker Desktop（本地）或 Docker Engine 与 Compose 插件（Linux 云主机），并确认 <Text code>docker compose version</Text> 可执行。</li>
              <li>在项目根目录执行 <Text code>cp .env.deploy.example .env.deploy</Text>，编辑其中的公开域名、端口和 <Text code>AUTH_SECRET</Text>。</li>
              <li>执行 <Text code>pnpm deploy:build</Text>。它会按 Compose 的五个 Dockerfile 构建镜像，第一次耗时较长，后续会使用层缓存。</li>
              <li>执行 <Text code>pnpm deploy:up</Text>。Compose 在后台创建网络、volume 和容器，可通过 <Text code>docker compose --env-file .env.deploy -f docker-compose.prod.yml ps</Text> 观察 healthy 状态。</li>
              <li>执行下面的 seed 命令。它会创建演示账号、6 份作品、6 份模板；重复执行会按固定标题归并，不会重复创建。</li>
            </ol>
            <CodeBlock>{`docker compose --env-file .env.deploy -f docker-compose.prod.yml exec \\
  biz-editor-server node apps/biz-editor-server/dist/scripts/seed-demo-content.js

# 演示账号：13800138000
# 验证码：.env.deploy 中的 MOCK_SMS_CODE（默认 123456）`}</CodeBlock>
          </DeploymentSection>

          <DeploymentSection id="update" title="更新、查看日志与停止">
            <div className="deployment-command-grid">
              <CommandCard command="pnpm deploy:build" description="代码或前端公开地址变化后重新构建镜像。" />
              <CommandCard command="pnpm deploy:up" description="后台启动，或用新镜像重建服务。" />
              <CommandCard command="pnpm deploy:logs" description="持续查看所有容器日志；也可在命令末尾添加服务名。" />
              <CommandCard command="pnpm deploy:down" description="停止并移除容器和网络，Mongo 数据卷会保留。" />
            </div>
            <Paragraph>常规更新顺序：拉取代码后运行 <Text code>pnpm deploy:build</Text>，再运行 <Text code>pnpm deploy:up</Text>。如果只改了 <Text code>.env.deploy</Text> 的运行时变量，直接运行 <Text code>pnpm deploy:up</Text> 即可；若改的是前端公开地址，必须重新构建。</Paragraph>
          </DeploymentSection>

          <DeploymentSection id="data-security" title="数据持久化与安全边界">
            <div className="deployment-two-columns">
              <InfoCard title="数据不会随 down 消失" icon={<Database size={18} />} items={['Mongo 数据写入命名 volume：ai-editor-prod-mongo-data。', 'pnpm deploy:down 只移除容器和网络，下一次 up 会挂回同一份数据。', '只有明确执行 docker compose down -v 才会删除 volume，执行前必须做好备份。']} />
              <InfoCard title="Mongo 不对外开放" icon={<ShieldCheck size={18} />} items={['mongo 服务没有 ports 配置，宿主机和公网都不能直接连 27017。', '只有同一 Compose 网络中的两个 API 服务可以用 mongo:27017 访问它。', '线上只让反向代理暴露 80/443；7001、7002、7003、8080、8081 也建议只绑定内网。']} />
            </div>
          </DeploymentSection>

          <DeploymentSection id="troubleshooting" title="常见问题排查">
            <div className="deployment-troubleshooting">
              <TroubleItem title="页面能打开但请求 API 失败" content="检查 API_PUBLIC_BASE_URL 是否是浏览器实际能访问的地址。它属于 VITE 构建变量，修改后必须 pnpm deploy:build && pnpm deploy:up。" />
              <TroubleItem title="容器一直没有 healthy" content="执行 pnpm deploy:logs，先看 mongo，再看对应 API。Mongo 未 healthy 时 API 不会启动；API 的 /api/health 返回成功后才会 healthy。" />
              <TroubleItem title="端口被占用" content="修改 .env.deploy 中的 FE_PORT、API_PORT 等宿主机端口，然后再次 pnpm deploy:up。容器内部端口不需要修改。" />
              <TroubleItem title="想查看或备份 Mongo" content="使用 docker compose exec mongo mongosh 在容器内部操作，或从 volume 做备份；不要为了方便重新暴露 Mongo 端口。" />
              <TroubleItem title="域名和 HTTPS 如何接入" content="在宿主机使用 Nginx 或 Caddy 接收 80/443，再按域名反向代理到各服务端口。证书和反向代理属于 Compose 外的一层入口治理。" />
            </div>
          </DeploymentSection>
        </div>
      </div>
    </main>
  )
}

function DeploymentSection({ children, id, title }: { children: ReactNode; id: string; title: string }) {
  return <section className="deployment-section" id={id}><Title level={4}>{title}</Title>{children}</section>
}

function InfoCard({ icon, items, title }: { icon: ReactNode; items: string[]; title: string }) {
  return <Card className="deployment-info-card" size="small" title={<span>{icon}{title}</span>}><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></Card>
}

function FlowItem({ description, step, title }: { description: string; step: string; title: string }) {
  return <div className="deployment-flow-item"><span>{step}</span><div><Text strong>{title}</Text><Text type="secondary">{description}</Text></div></div>
}

function CommandCard({ command, description }: { command: string; description: string }) {
  return <Card size="small"><Text code>{command}</Text><Text type="secondary">{description}</Text></Card>
}

function TroubleItem({ content, title }: { content: string; title: string }) {
  return <div><Tag color="volcano">排查</Tag><Text strong>{title}</Text><Paragraph type="secondary">{content}</Paragraph></div>
}

function CodeBlock({ children }: { children: string }) {
  return <pre className="deployment-code"><code>{children}</code></pre>
}

export default DeploymentPage
