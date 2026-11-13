export type LearningNoteCategory =
  | '需求分析'
  | '架构设计'
  | '组件库'
  | '编辑器'
  | '画布交互'
  | '历史系统'
  | '工程化'
  | '实施计划'

export interface LearningNote {
  id: string
  category: LearningNoteCategory
  title: string
  summary: string
  background: string
  goals: string[]
  decision: string
  keyDesigns: string[]
  implementation: string
  implementationDetails: string[]
  tests: string[]
  nextStep: string
}

export const learningNoteCategories: LearningNoteCategory[] = [
  '需求分析',
  '架构设计',
  '组件库',
  '编辑器',
  '画布交互',
  '历史系统',
  '工程化',
  '实施计划',
]

export const learningNotes: LearningNote[] = [
  {
    id: 'project-five-app-architecture-explained',
    category: '架构设计',
    title: '项目五应用架构与职责边界详解',
    summary: '解释业务前台、业务 API、公开 H5、管理后台和管理 API 为什么拆成五个应用，以及它们如何通过共享协议和数据模型组成一个完整产品。',
    background: '项目由 AI 协助完成后，最需要掌握的不是每个组件的写法，而是为什么存在五个独立应用、一次用户操作经过哪些服务，以及拆分带来了什么收益和成本。',
    goals: ['能独立说明五个应用各自服务的用户和业务边界。', '能从首页创建、后台治理和公开访问三条路径解释请求流向。', '理解应用拆分不是为了增加目录，而是隔离运行时、权限和发布节奏。'],
    decision: '采用一个 pnpm workspace 管理五个可独立启动和部署的应用，同时用 editor-schema 与 biz-components 共享页面数据协议和渲染能力。',
    keyDesigns: ['biz-editor-fe 是 React + Vite 的业务工作台，本地端口 5173、Docker 端口 8080；负责登录、模板市场、作品列表、可视化编辑器、AI 抽屉和保存发布交互，不直接连接 MongoDB 或模型供应商。', 'biz-editor-server 是 NestJS 业务 API，本地和容器端口 7001；负责用户身份、作品与模板、发布状态、渠道统计、消息、AI 代理和生成历史，是普通用户业务规则的唯一服务端入口。', 'h5-server 是 Next.js 公开展示端，端口 7002；通过作品 UUID 拉取已发布内容并服务 /p/:uuid，面向最终访问者而非编辑用户，因此可以独立做 SSR、缓存、SEO 和公开访问策略。', 'admin-fe 是 React + Vite 的治理工作台，本地端口 7004、Docker 端口 8081；负责作品下线、用户冻结和治理审计等后台界面，不把管理操作混入普通用户工作台。', 'admin-server 是独立 NestJS 管理 API，端口 7003；与业务 API 共享 MongoDB 和 AUTH_SECRET，但每次请求都再次验证管理员角色和账号状态，形成独立的权限边界。', 'packages/editor-schema 统一 WorkContent、组件和事件结构，避免编辑器保存一种格式、H5 渲染另一种格式；packages/biz-components 提供编辑端和展示端可复用的组件实现。'],
    implementation: '当前根 package.json 通过 Turbo 和 pnpm filter 统一编排五个应用，开发环境使用 pnpm dev:local，生产环境由五份镜像和一个 MongoDB 服务组合运行。',
    implementationDetails: ['普通创作路径：首页或模板市场位于 biz-editor-fe，登录和作品请求进入 biz-editor-server，编辑器把 WorkContent 保存到 MongoDB，发布后由 h5-server 根据 UUID 获取并渲染同一份内容。', '后台治理路径：biz-editor-fe 将用户带到 admin-fe，admin-fe 先向 biz-editor-server 确认身份，再携带同一签名 Token 请求 admin-server；管理服务执行角色检查后才允许修改用户或作品状态。', '公开访问路径：访客只打开 h5-server 的 /p/:uuid；H5 服务向业务 API 查询已发布作品，不需要加载整个编辑器、管理后台或 AI 代码。', '拆分收益是权限隔离、公开渲染隔离和独立部署；成本是环境变量、跨域、端口、健康检查和多服务日志更复杂。对于当前演示项目，这种复杂度仍然有价值，因为它能展示完整全栈边界。'],
    tests: ['核对根 package.json 中 dev:apps、dev:local、build 和 typecheck 编排。', '核对五个应用 package.json 的开发端口和启动方式。', '核对 docker-compose.prod.yml 中六个服务的依赖、端口和健康检查。', '现有浏览器验收已覆盖前台编辑、后台访问和发布 H5 三条路径。'],
    nextStep: '对外讲解时先画出“创作工作台 → 业务 API → MongoDB → 公开 H5”和“管理后台 → 管理 API → MongoDB”两条主链路，再补充共享包即可。',
  },
  {
    id: 'shared-auth-token-flow-explained',
    category: '架构设计',
    title: '登录 Token 在前台、后台与接口间的传递详解',
    summary: '说明手机号登录如何签发 Token、业务请求如何携带 Bearer 身份，以及管理后台如何复用身份但重新执行管理员授权。',
    background: '“已经登录”和“有后台权限”是两件不同的事。项目曾出现普通账号进入后台后提示无权限，这正是身份认证成功、管理授权失败的正确表现。',
    goals: ['区分认证 Authentication 与授权 Authorization。', '能解释普通前台、业务 API、管理前台和管理 API 的完整 Token 流向。', '理解共享 AUTH_SECRET 的用途、限制和生产安全要求。'],
    decision: '演示环境使用服务端 HMAC-SHA256 签名的七天 Token，通过 Authorization: Bearer 传递；业务 API 和管理 API共享 AUTH_SECRET，但分别执行自己的用户状态与角色校验。',
    keyDesigns: ['用户向 biz-editor-server 请求验证码并提交手机号与验证码；服务端查找或创建用户，确认账号未冻结后签发包含 sub、username、nickName、phoneNumber、role、iat 和 exp 的三段式签名 Token。', 'biz-editor-fe 将 Token 保存在 localStorage 的 ai-editor-auth-token；统一 request 和 AI 流请求读取 Token，并自动添加 Authorization: Bearer <token>，业务组件不需要重复拼接请求头。', 'biz-editor-server 的 AuthGuard 先提取 Bearer Token，校验 HMAC 签名和过期时间，再根据 sub 查询 MongoDB 中的最新用户记录；因此冻结账号后，即使旧 Token 尚未过期也会被拒绝。', '从业务首页进入后台时，前端把 Token 和 redirect 放入 admin-fe 登录 URL；admin-fe 保存到独立的 ai-editor-admin-auth-token，先调用业务 API 的 /auth/me 验证身份并确认 role=admin。', 'admin-fe 后续通过 adminRequest 把同一 Token 发给 7003；admin-server 使用相同 AUTH_SECRET 验签，再查询数据库确认用户仍是管理员且未冻结。普通账号会得到 403“无后台访问权限”，无 Token 或无效 Token 得到 401。', '前台和后台使用两个 localStorage key，退出某个端不会无意清除另一个端的状态；但它们信任的是同一个服务端签名身份，而不是前端传来的 role 字段。'],
    implementation: '业务 Token 由 biz-editor-server 的 AuthTokenService 签发；两个 Nest Guard 都不只相信 Token 内容，而会重新读取用户状态，管理 Guard 额外执行管理员角色检查。',
    implementationDetails: ['签名不是加密：Token payload 可以被浏览器读取，但无法在不知道 AUTH_SECRET 的情况下合法篡改；因此 payload 不能放密码、API Key 等秘密。', 'AUTH_SECRET 必须在业务 API 和管理 API 中完全一致，否则业务服务签发的 Token 无法被管理服务验证；生产环境必须替换 Compose 中的默认值。', '当前通过 URL query 把 Token 从业务前台交给管理前台，适合本地演示和两个独立 SPA 的快速单点体验，但 URL 可能进入浏览历史或代理日志。', '正式生产可升级为 HTTPS 下的 HttpOnly、Secure、SameSite Cookie，或由业务服务签发一次性短码、后台服务交换会话，避免长期 Token 出现在 URL 和 JavaScript 可读存储中。', '401 表示身份不存在、格式错误、签名错误或过期；403 表示身份有效但账号被冻结或缺少管理员权限。前端应分别处理重新登录与权限提示。'],
    tests: ['核对 biz-editor-fe 与 admin-fe 的两个 authStorage key 和统一请求封装。', '核对业务 AuthGuard、AuthService 和 AuthTokenService 的验签、过期与冻结检查。', '核对 admin-fe LoginPage 的共享 Token 接收和 role=admin 前置判断。', '核对 admin-server AdminAuthGuard 的数据库角色复查；浏览器已验证普通账号会显示“当前账号没有后台访问权限”。'],
    nextStep: '公开部署前至少启用 HTTPS、生成强随机 AUTH_SECRET，并评估将 URL Token 交接替换为一次性登录交换码。',
  },
  {
    id: 'ai-agent-request-tool-flow-explained',
    category: '架构设计',
    title: 'AI Agent、SSE 与受控工具调用链路详解',
    summary: '从用户填写需求开始，解释请求如何经过前端、NestJS、OpenAI 兼容模型、服务端工具、草稿校验和 MongoDB 历史，最终成为可预览的 WorkContent。',
    background: '项目的 AI 不是把模型回复放进聊天框，而是把模型能力接入真实页面生产流程。理解这条链路，才能说明它为什么是 Agent 应用而不是普通文本生成。',
    goals: ['能按时间顺序讲清前端、业务 API、模型供应商和工具之间的交互。', '理解为什么使用 fetch 读取 SSE，而不是浏览器 EventSource。', '理解模型只负责语义参数，服务端才拥有页面结构和安全边界。'],
    decision: '使用鉴权 POST 请求承载完整创作上下文，后端代理 OpenAI 兼容 Chat Completions 流；Agent 最多执行三轮工具循环，服务端只接受 build_landing_page_draft 和 validate_page_draft 两个工具。',
    keyDesigns: ['用户在 AiGeneratorDrawer 选择七类创作方向之一，填写主题、受众、目标、调性和可选修改要求；已有草稿还可附带受限当前页面上下文。', '前端 streamAiPageDraft 使用 fetch POST JSON，并携带 Bearer Token；EventSource 只方便 GET 且不能自然携带自定义 Authorization 和复杂 body，所以前端直接读取 response.body 的 ReadableStream 并按空行拆分 SSE 帧。', 'AiController 先通过 AuthGuard，设置 text/event-stream、no-cache 和 keep-alive 响应头；AiService 校验 LLM_API_BASE_URL、LLM_API_KEY 和 LLM_MODEL，只在服务端读取密钥。', '服务端创建 status=running 的 AiRun，关联当前用户、场景、需求和模型；随后用系统提示词限制输出，并把用户需求转换为模型消息。', 'requestModel 请求 /chat/completions，开启 stream，并增量解析 content 与 tool_calls；服务端把 status、token、tool_call、tool_result、draft、done 或 error 事件实时转发给前端，前端只显示可读过程。', '模型必须调用 build_landing_page_draft，但模型传回的只是标题、视觉方向、颜色、主图、正文、卖点和 CTA 等受限参数；buildDraft 在服务端固定生成 375×900 页面和 l-image、l-text、l-button 六个组件。', '主图只接受 images.unsplash.com 的 HTTPS URL，颜色只接受六位十六进制值，文字按字段截断，CTA 由服务端写入固定 track 与 link 事件；未知字段和未知工具不会成为页面代码。', '每次构建后服务端强制运行 validateDraft，并在结束前再次校验组件数量、组件白名单和布局坐标；没有合法草稿就返回安全错误，不写入 completed 结果。', '成功后 AiRun 更新为 completed 并保存标题、描述、步骤和 WorkContent；历史按用户隔离、按时间倒序并裁剪到最近 20 条，其他用户无法读取该记录。'],
    implementation: 'AI 页面生成形成“需求 → POST SSE → 模型流 → Tool Call → 服务端映射 → 服务端校验 → Mongo 历史 → 候选预览”的完整链路；文案助手、整页优化和页面体检复用同一鉴权与流式基础设施。',
    implementationDetails: ['最大三轮是成本和可控性的边界，避免模型无限调用工具；模型请求有 90 秒超时，浏览器停止或连接关闭时 AbortController 会取消上游请求。', 'copy-suggestions、page-copy-optimization 和 page-audit 同样从服务端调用模型，但要求严格 JSON，并继续执行长度、事实片段、组件 ID、评分和问题数量清洗；它们不会让模型直接修改画布。', '页面体检不会发送图片 URL，只发送页面尺寸、背景色、受限文本和布局；模型返回四维评分和问题后，服务端过滤未知组件 ID 和非法严重程度。', 'LLM Key 不会进入 Vite 构建参数、浏览器请求或 SSE 响应；浏览器只持有登录 Token，模型供应商 Bearer Key 仅由 biz-editor-server 使用。', '这套实现没有引入 LangChain 或 LangGraph，优点是链路短、依赖少、容易展示；缺点是复杂 Agent 编排、重试策略、观测和评测能力需要自行实现。'],
    tests: ['核对 AiController 四个鉴权 SSE 接口和最近 20 条历史接口。', '核对 AiService 的三轮循环、OpenAI 兼容流解析、工具白名单、两次草稿校验、超时取消和安全错误映射。', '真实 DeepSeek 联调已验证页面构建、草稿校验、六组件结果、历史写入、局部文案、整页优化和页面体检。', '全链路浏览器验收已完成 AI 生成、应用、文案精修、82 分页面体检、保存、发布和 H5 展示。'],
    nextStep: '面试或演示时重点强调“模型不生成任意代码，服务端工具把语义结果映射成领域模型”这一安全设计，而不是只强调调用了某个模型。',
  },
  {
    id: 'ai-draft-confirm-save-boundary-explained',
    category: '编辑器',
    title: 'AI 草稿确认、应用、保存与发布边界详解',
    summary: '解释为什么 AI 生成成功后仍只是候选、应用画布后为什么保持未保存，以及自动保存、手动保存、发布和模板发布之间如何避免误覆盖。',
    background: '编辑器原本存在五秒自动保存，如果 AI 草稿一应用就沿用普通编辑自动保存，会在用户还没确认时覆盖已有作品。因此 AI 能力必须有比普通编辑更严格的持久化边界。',
    goals: ['区分生成草稿、应用画布、保存作品和发布 H5 四个状态。', '能解释新建作品和替换当前画布两种应用模式。', '理解手动保存锁、脏状态、基线快照和离开提醒如何共同保护用户数据。'],
    decision: '所有 AI 输出默认是候选；预览不修改画布，应用前二次确认，应用后只更新浏览器内 Zustand 状态并强制进入手动保存模式，直到用户点击保存、发布或发布模板。',
    keyDesigns: ['生成完成后 AiGeneratorDrawer 先使用 H5PreviewRenderer 展示草稿、标题、摘要和组件数量；放弃、关闭或切换历史都不会改变当前作品。', '当前没有作品时，“应用到画布”在确认后加载 WorkContent；当前已有作品时默认“创建为新作品”，通过路由 state 把草稿带到无 workId 的 /editor，原作品不会被修改。', '用户也可以明确选择危险操作“替换当前画布”；确认文案说明不会自动保存或发布，按钮使用危险样式，执行后替换组件、标题和描述并关闭抽屉。', 'handleApplyAiDraft 和 AI 文案应用都会把 aiDraftRequiresManualSaveRef 设为 true；编辑器虽然把 saveStatus 标记为 dirty，但五秒自动保存 effect 看到该锁后立即退出。', 'currentWorkSnapshot 与 baselineSnapshotRef 比较页面元数据和 WorkContent；有差异时进入 dirty，撤销回基线时恢复 saved 或 idle，并解除手动保存锁。', 'dirty、saving 或 error 状态注册 beforeunload 提醒，减少误关闭页面造成的未保存丢失；这不是持久化，只是浏览器离开保护。', '用户点击保存后 saveCurrentWork 先解除手动锁并进入 saving：有 workId 调用更新接口，无 workId 调用创建接口并跳转到新 UUID；成功后刷新基线、时间和 saved 状态。', '用户点击发布时不是直接切换状态，而是先执行 saveCurrentWork，再调用 publish 接口；因此 H5 看到的是用户明确确认后的最新持久化版本。', '发布模板也先保存；普通作品发布为模板时服务端创建模板副本，原作品仍保留，避免“发布为模板之后作品消失”的语义问题。'],
    implementation: 'AI 草稿、单组件文案和整页文案应用全部复用编辑器历史与脏状态，但额外设置手动保存锁；页面体检保持只读，只定位问题，不修改 Zustand。',
    implementationDetails: ['Zustand loadWorkContent 只改变前端画布状态，不会隐式发起 API 请求；真正的 MongoDB 写入只发生在 create/update/publish/template 等显式 mutation。', 'AI 文案单项替换和批量替换会进入撤销历史，一键整页应用合并为一条历史记录；这保证 AI 修改和人工修改使用同一套撤销语义。', '保存时生成封面；封面过大或远程主图加载超时时会降级，避免保存永久卡住，但不改变页面正文和组件内容。', '用户确认边界的代价是应用草稿后若强制关闭且忽略浏览器提醒，未保存内容会丢失；这是有意选择，优先保证 AI 不会静默覆盖服务端作品。', '如果未来增加协作编辑或跨设备草稿，应新增独立 draft revision 持久化，而不是重新开启 AI 应用后的普通自动保存。'],
    tests: ['浏览器已验证草稿预览和放弃不会改变画布。', '已有作品选择创建为新作品后进入无 UUID 编辑器，等待超过五秒仍未自动保存，原作品保持不变。', 'AI 草稿和 AI 文案应用后均显示未保存，撤销可恢复原文或保存基线。', '手动保存后创建独立 UUID，发布后 H5 正确展示；模板发布会保留原作品。'],
    nextStep: '演示时刻意停留在“未保存”状态并说明用户拥有最终决定权，这是产品可信度和 AI 安全边界最直观的证据。',
  },
  {
    id: 'docker-images-compose-network-explained',
    category: '工程化',
    title: 'Docker 镜像、Compose 编排与环境变量详解',
    summary: '说明每个项目如何构建镜像、Compose 如何等待和连接服务、MongoDB 数据如何保留，以及公开地址、容器内地址和构建期变量为什么不能混用。',
    background: 'Docker 最容易困惑的地方不是命令，而是三个层次：Dockerfile 负责单个应用镜像，Compose 负责多个容器关系，环境变量负责把同一镜像连接到当前部署环境。',
    goals: ['能解释五份 Dockerfile 的构建阶段和运行阶段。', '能读懂 depends_on、healthcheck、ports、service name 和 volume。', '能区分浏览器可访问 URL、容器内部 URL、Vite/Next 构建期变量和 Node 运行期秘密。'],
    decision: '五个应用分别构建最小生产镜像，由 docker-compose.prod.yml 编排；MongoDB 只加入 Compose 内部网络且使用命名卷持久化，模型 Key 和签名 Secret 只注入服务端容器。',
    keyDesigns: ['biz-editor-fe 与 admin-fe 使用多阶段构建：node:22-alpine builder 安装 workspace 依赖并执行 Vite build，runner 只使用 nginx:1.27-alpine 托管 dist；最终镜像不包含 TypeScript 源码、pnpm 或开发服务器。', 'biz-editor-server 与 admin-server 先在 builder 编译 NestJS，再在 runner 只安装对应服务的 production dependencies 并复制 dist，通过 node dist/main.js 启动。', 'h5-server 使用 Next standalone 输出：builder 编译共享组件和 Next 应用，runner 只复制 standalone 与 static，由精简的 server.js 在 7002 运行。', 'Compose 自动创建内部网络，服务名会成为 DNS：h5-server 可以访问 http://biz-editor-server:7001/api，两个 API 可以访问 mongodb://mongo:27017/ai_editor；localhost 在容器内只代表当前容器，不能用来访问相邻服务。', 'ports 左侧是宿主机端口、右侧是容器端口，例如 8080:80 表示浏览器访问宿主机 8080，流量转发到 biz-editor-fe 容器的 Nginx 80。Mongo 没有 ports，因此默认不能从公网或宿主机直接访问。', 'depends_on 配合 condition: service_healthy 让业务 API 等待 Mongo，H5 和前端等待业务 API；healthcheck 不保证业务永不失败，但能避免依赖尚未就绪时盲目启动。', 'ai-editor-prod-mongo-data 是命名卷，容器重建或普通 docker compose down 不会删除数据库；只有显式 down -v 或删除 volume 才会清空数据。', 'VITE_* 和 NEXT_PUBLIC_* 会进入浏览器代码，必须在 build args 阶段确定，只能放公开 API 地址；AUTH_SECRET、MONGODB_URI 和 LLM_API_KEY 是运行期服务端环境变量，绝不能使用 VITE_ 或 NEXT_PUBLIC_ 前缀。'],
    implementation: '根命令 deploy:build、deploy:up、deploy:logs 和 deploy:down 统一读取 .env.deploy；Compose 把公开地址写入前端构建参数，把内部服务名和秘密写入服务端运行环境。',
    implementationDetails: ['API_PUBLIC_BASE_URL、H5_PUBLIC_BASE_URL、ADMIN_API_PUBLIC_BASE_URL 和 ADMIN_FE_PUBLIC_BASE_URL 是用户浏览器能够访问的地址，部署到域名后不能继续使用 localhost。', 'H5_API_BASE_URL=http://biz-editor-server:7001/api 是服务端容器间地址；NEXT_PUBLIC_H5_API_BASE_URL 是 H5 中可能由浏览器发起请求时使用的公开地址，两者服务对象不同。', 'MONGODB_URI 默认使用 mongo 服务名；如果改用 MongoDB Atlas，应把完整连接串注入两个 Nest 服务并确保网络白名单允许部署平台访问。', 'AUTH_SECRET 必须同时注入业务 API 与管理 API；LLM 三个变量只需要注入 biz-editor-server，前端和管理服务不应获得模型 Key。', 'restart: unless-stopped 让异常退出的容器自动恢复；日志仍通过 docker compose logs -f 集中查看。生产部署还需要域名、HTTPS、反向代理或云平台路由，以及数据库备份。', '如果使用 Vercel、Render 和 Atlas 等托管平台，不一定继续运行同一份 Compose，但 Dockerfile、服务边界和变量分类仍然成立：每个 Compose service 对应一个云服务，内部 DNS 改成平台提供的服务 URL。'],
    tests: ['核对五份 Dockerfile 的 builder/runner、生产依赖和启动命令。', '核对 docker-compose.prod.yml 的六个服务、健康检查、依赖顺序、端口和命名卷。', '本地生产模拟已验证 Compose 启动、API 健康检查、首页、管理后台和 H5 访问。', '演示数据 seed 已验证重复执行保持幂等，Mongo 容器无宿主机端口暴露。'],
    nextStep: '没有自有服务器时，将三个展示应用部署到 Vercel、两个 Nest 服务部署到 Render、MongoDB 使用 Atlas；迁移时逐项映射 Compose 环境变量而不是改业务代码。',
  },
  {
    id: 'homepage-product-demo-video',
    category: '实施计划',
    title: '首页 AI 产品演示视频入口',
    summary: '将 2 分 20 秒 AI Editor 产品演示接入首页 Hero，通过封面预览和大尺寸弹窗快速讲清完整创作闭环。',
    background: '首页已经能直接进入 AI 创作，但第一次访问者仍需要实际操作才能理解草稿生成、文案精修、页面体检和 H5 发布之间的关系。',
    goals: ['首页首屏可直接观看产品演示。', '不让大视频阻塞首屏加载。', '保持 AI 创作为主操作，视频为辅助理解入口。'],
    decision: 'Hero 增加“观看 2 分钟演示”次级按钮，点击后在 16:9 弹窗中播放；视频不自动在首页背景播放。',
    keyDesigns: ['视频使用 preload=metadata 和独立压缩封面。', '弹窗打开后播放，关闭时暂停并回到开头。', '弹窗底部概括一句需求、AI 草稿、文案精修、页面体检和发布 H5 五步。', '精品模板调整为低层级文字入口，避免三个主按钮竞争。'],
    implementation: '已将演示 MP4 与封面放入前端 public，并完成首页播放入口、响应式弹窗和关闭重置逻辑。',
    implementationDetails: ['演示视频约 17.7 MB，不参与首页首屏图片渲染。', '桌面弹窗最大宽度 1120px，移动端按视口宽度自适应。'],
    tests: ['biz-editor-fe typecheck 和 production build 通过。', '桌面浏览器确认首页入口、弹窗标题、五步说明和视频播放正常；视频识别为 140 秒，播放 1.5 秒后进度正确推进且控制台无错误。', '关闭弹窗后视频暂停并重置；410px 移动端下弹窗宽度保持在视口内，视频维持 16:9 且无默认白色内边距。', '静态视频请求返回 video/mp4，Content-Length 为 18,585,616 字节。'],
    nextStep: '部署时视频随前端静态资源发布；如接入对象存储，可将视频 URL 替换为 CDN 地址。',
  },
  {
    id: 'ai-editor-product-tour-video',
    category: '实施计划',
    title: 'AI Editor 产品演示视频',
    summary: '制作 2 分 20 秒中文产品演示视频，完整呈现从一句需求到可编辑草稿、文案精修、页面体检和 H5 发布的 AI 创作闭环。',
    background: 'AI 功能已经完成全链路验收，需要一份不依赖现场操作的展示材料，让体验者快速理解产品价值、真实界面和用户确认边界。',
    goals: ['用 2 至 3 分钟讲清 AI Editor 的核心价值。', '使用真实产品截图呈现完整创作路径。', '提供可复用的旁白、分镜和视觉规范。', '输出可直接播放的高清成片。'],
    decision: '采用 1920×1080 深海军蓝发布会视觉，以橙色强调真实操作区域；中文旁白和内嵌字幕同步呈现，不录制冗长的实时等待过程。',
    keyDesigns: ['九段叙事覆盖首页入口、需求描述、候选草稿、应用画布、文案助手、页面体检、保存发布和价值收束。', '所有产品画面来自已登录的真实本地应用，未为录制新增、修改或发布业务数据。', 'AI 始终作为候选生成与优化能力呈现，保存和发布仍由用户明确触发。', 'DESIGN.md、SCRIPT.md、STORYBOARD.md 和 transcript.json 分别沉淀视觉规范、口播稿、分镜与字幕时间轴。'],
    implementation: '已在 demo/ai-editor-product-tour 完成 HyperFrames 演示工程、中文配音、内嵌字幕、真实产品截图和最终 MP4。',
    implementationDetails: ['成片总时长 140 秒，共 9 个场景，旁白约 131 秒。', '演示路径：AI 首页入口 → 填写需求 → 生成候选草稿 → 应用到画布 → AI 文案候选 → 页面体检 82 分 → 保存发布 → H5 成品。', '最终视频为 H.264 1920×1080、24fps，音频为 AAC 48kHz 双声道，文件约 17.7 MB。'],
    tests: ['HyperFrames npm run check 通过：运行时 0 错误、布局 0 问题、动效 0 错误、对比度 56/56 通过。', 'Studio 浏览器识别 2:20 时长、9 个场景和独立音轨。', '最终 MP4 使用 ffprobe 验证为 140 秒、1920×1080、24fps，并包含 H.264 视频与 AAC 音轨。', '抽查开场、编辑器中段和结尾关键帧，产品截图、强调框和字幕均清晰且无溢出。'],
    nextStep: '成片可直接用于项目介绍；后续产品界面有明显变化时，按现有脚本和分镜替换对应截图即可。',
  },
  {
    id: 'ai-end-to-end-acceptance',
    category: '实施计划',
    title: 'AI 全链路验收与保存边界修复',
    summary: '从通用创作开始完成草稿应用、局部文案、页面体检、保存、发布和 H5 渲染，并修复大封面导致的新作品保存失败。',
    background: 'AI 功能已分别完成验证，但正式收尾前需要用同一条用户路径确认各模块可以连续工作，并检查密钥与持久化边界。',
    goals: ['完成一条可重复演示的 AI 创作主路径。', '确认 AI 修改不会绕过用户确认、保存和发布。', '发现并修复真实联调中的阻断问题。', '确认模型密钥没有进入前端产物。'],
    decision: '以全新通用作品完成真实验收，不修改既有作品；保存和发布仍必须由用户明确触发。',
    keyDesigns: ['Nest JSON 与 urlencoded 请求体限制设为 2 MB，支持编辑器封面 data URL。', '封面超过 1.5 MB 时前端主动放弃，服务端 DTO 同步执行长度校验。', 'saveCurrentWork 一开始即进入 saving，阻止封面生成期间触发并发自动保存。', '前端生产构建与 Git 跟踪文件均扫描常见 sk- 密钥格式。'],
    implementation: '已修复保存请求体边界和保存状态时序，并完成通用 AI 作品发布验收。',
    implementationDetails: ['演示流程：从首页选择 AI → 通用创作 → 使用示例或填写需求 → 生成并应用草稿 → 文案助手精修 → 页面体检 → 保存发布并打开 H5。', '页面体检只定位问题，不自动修改或保存。', '发布作品 UUID 为 7330ed95-e8ed-48c2-85a1-4b9bd144289c。'],
    tests: ['通用草稿应用后加载 6 个组件并保持未保存。', '主标题文案助手返回 3 个候选，应用后画布进入未保存状态。', '页面体检返回 78 分、四维评分和 5 条问题，定位 CTA 后打开文案助手且状态仍未保存。', '首次保存复现 request entity too large；修复后新作品保存成功并获得独立 UUID。', '作品发布成功，H5 返回正确标题、主视觉、文案、卖点和 CTA。', 'biz-editor-fe/dist 与 Git 跟踪文件均未发现常见 sk- 密钥。'],
    nextStep: 'AI 演示主链路已通过，项目进入维护状态，仅修复真实缺陷。',
  },
  {
    id: 'ai-creation-direction-expansion',
    category: '实施计划',
    title: 'AI 创作方向扩展',
    summary: '将 AI 页面生成从三个基础场景扩展为七类创作方向，并增加不限制业务类型的通用创作。',
    background: '品牌宣传、商品种草和活动报名可以验证主链路，但下拉选项过少会让体验者误以为模型只能处理三类页面。',
    goals: ['覆盖促销、新品和招募等常见运营场景。', '提供通用创作入口，明确预设不等于能力边界。', '保持首页简洁，不增加过多快捷按钮。'],
    decision: '抽屉将“创作场景”改为“创作方向”并扩展到七类；首页仍只保留三个高频入口，其他方向进入编辑器后选择。',
    keyDesigns: ['新增节日促销、新品发布、招聘招募和通用创作。', '每个方向都有独立主题示例、受众、目标、调性和用途说明。', '服务端 DTO 严格校验七个固定枚举，并将英文值映射为中文提示词。', '通用创作只放宽业务语义，不放宽 l-text、l-image、l-button 组件白名单。', '节日促销和新品发布复用商品类主视觉 fallback，招聘招募复用报名类 fallback。'],
    implementation: '已同步扩展前后端场景类型、服务端提示词、默认草稿策略、历史记录类型、URL 参数校验和前端示例配置。',
    implementationDetails: ['AiPageScene 统一描述七类前端方向。', 'CreatePageDraftDto 拒绝七类之外的任意值。', '首页 brand、product、signup 快捷入口保持不变。'],
    tests: ['前后端 typecheck/build、AiGeneratorDrawer ESLint 和 git diff --check 通过。', '浏览器确认七个方向完整显示，字段标题已改为“创作方向”。', '/editor?ai=custom 可直达通用创作，默认受众、目标、调性和完整示例填充正确。', '使用 DeepSeek deepseek-v4-flash 真实生成“社区夏日生活节”，11.6 秒完成 6 组件受控草稿并写入创作记录。', '通用草稿结果优先展示，工具过程默认收起，测试未应用或保存画布。'],
    nextStep: '七类创作方向已经覆盖演示需求，不继续增加细分场景。',
  },
  {
    id: 'ai-first-run-experience',
    category: '实施计划',
    title: 'AI 首次生成体验优化',
    summary: '为三类 AI 创作场景提供可直接使用的优美示例、默认需求和清晰的生成后操作路径，降低首次体验成本。',
    background: '首页已经能把体验者带入 AI Agent，但空白主题、目标和调性表单仍需要用户自行组织完整需求，第一次生成的启动成本偏高。',
    goals: ['每个场景提供一套可展示的完整示例。', '从首页进入时自动提供合适的受众、目标和调性。', '展示实时生成耗时和应用后的保存发布路径。'],
    decision: '示例只填充表单，不自动调用模型；用户仍可在发送前修改所有内容，避免首页点击直接产生模型成本或覆盖画布。',
    keyDesigns: ['品牌宣传、商品种草和活动报名分别维护独立主题、受众、目标与调性。', '切换场景只更新建议受众、目标和调性，不覆盖用户已经填写的主题。', '“使用示例”一次填入完整需求，仍需用户明确点击生成。', '生成中实时显示耗时，草稿结果提示应用画布、检查保存、发布 H5 三步。', '生成时展开执行过程，成功后将草稿提前并自动折叠长策划文本与工具详情。'],
    implementation: '已完成 AiGeneratorDrawer 的场景预设、示例填充、生成计时、结果引导和执行过程折叠。',
    implementationDetails: ['首页 ai 查询参数继续负责首次场景选择。', '所有示例保留在前端静态配置中，不增加服务端接口或数据库结构。', '计时只展示本次浏览器请求耗时，不作为计费数据。', '新生成与修改版本开始时自动展开过程，成功后自动收起；历史草稿打开后直接展示结果。'],
    tests: ['biz-editor-fe typecheck/build、AiGeneratorDrawer ESLint 和 git diff --check 通过。', '商品种草从首页进入后自动填入对应受众、目标与调性，主题保持为空供用户输入。', '点击“使用示例”填入完整商品需求；切换活动报名后主题保持不变，其余建议值正确更新。', '使用 DeepSeek deepseek-v4-flash 真实生成活动报名示例，10.8 秒完成 6 组件草稿并写入创作记录。', '生成中实时计时，完成后显示应用画布、检查保存、发布 H5 三步引导，测试未应用或保存画布。', '浏览器从历史打开草稿后，候选结果排在执行详情之前且详情默认收起；点击“查看详情”可恢复页面构建与草稿校验步骤。'],
    nextStep: '首次 AI 体验已经闭环，不再增加新的生成入口。',
  },
  {
    id: 'homepage-ai-entry',
    category: '实施计划',
    title: '首页 AI 创作入口',
    summary: '将 AI 页面生成从编辑器内部能力提升为首页核心入口，让首次访问者直接感知并进入真实 Agent 创作链路。',
    background: '首页已有模板和案例展示，但 AI 能力只藏在编辑器工具栏中，体验者进入首页时无法快速判断项目具备真实 AI 生成能力。',
    goals: ['Hero 明确表达一句话生成营销页面。', '支持品牌宣传、商品种草和活动报名三个场景直达。', '登录前后保留 AI 创作意图并自动打开生成抽屉。'],
    decision: '首页只做 AI 能力认知和场景分流，不嵌入完整表单；通过受控查询参数进入编辑器，由现有 Agent 抽屉承接输入、流式生成和草稿应用。',
    keyDesigns: ['主 CTA 为“用 AI 创建页面”，模板浏览保留为次级路径。', '三个快捷场景只允许 brand、product、signup 固定值。', '未登录用户通过 login redirect 保留完整目标地址。', '进入编辑器只自动打开并预选场景，不自动调用模型或修改画布。', 'Hero 展示“描述需求 → 可编辑草稿 → 保存发布”的完整结果预期。'],
    implementation: '已新增首页 AI 主入口、场景快捷按钮、创作流程说明和编辑器场景预选能力。',
    implementationDetails: ['首页 AI 按钮导航到 /editor?ai=scene。', '编辑器校验查询参数后初始化 Agent 抽屉和创作场景。', '登录页沿用现有 redirect 参数，登录成功后继续进入对应 AI 场景。'],
    tests: ['biz-editor-fe typecheck/build 及 HomePage、AiGeneratorDrawer ESLint 通过；EditorPage 全文件 ESLint 仍有既有 effect/autosave 规则问题。', '桌面浏览器确认主 CTA、三个快捷场景、创作流程和模板搜索同时可见。', '商品种草与活动报名入口均进入新作品编辑器，Agent 自动打开并预选正确场景。', '未登录路径沿用已验证的 LoginPage redirect 回跳机制，目标地址包含完整 AI 场景参数。', '410px 移动端视口下 Hero 宽度与页面宽度一致，无横向滚动。'],
    nextStep: '首页已形成 AI 从零生成和模板快速修改两条清晰体验路径。',
  },
  {
    id: 'ai-page-audit',
    category: '实施计划',
    title: 'AI 页面体检',
    summary: '基于当前画布的受限文案与布局数据，对品牌一致性、信息层级、文案清晰度和 CTA 转化进行结构化评分。',
    background: '整页文案优化可以直接给出改写方案，但用户仍缺少一个先发现问题、再决定是否修改的页面级诊断入口。',
    goals: ['输出综合评分与固定四维评分。', '返回 3 至 5 个可执行问题，并在可能时关联画布组件。', '体检只读，运行过程不修改、不保存画布。'],
    decision: '在现有“AI 页面优化”抽屉增加“页面体检”标签，不新增工具栏按钮和数据库历史；文字问题定位后复用右侧 AI 文案助手完成修复。',
    keyDesigns: ['仅向模型发送标题、描述、页面尺寸、背景色及组件 ID、类型、文案和布局，不发送图片 URL。', '服务端固定四个评分维度，分数限制为 0 至 100，并过滤未知组件 ID、非法严重程度和不完整问题。', '文字与按钮问题提供“定位并修复”，图片问题提供“定位组件”，页面级问题不强制关联组件。', '提示词明确主视觉可作为背景，缺少图片内容和对比度证据时不把文字叠图误判为遮挡。', 'DeepSeek 体检请求关闭默认高强度思考，缩短演示等待时间。'],
    implementation: '已新增鉴权 SSE 体检接口、严格结果清洗、抽屉双标签、评分结果页和组件定位闭环。',
    implementationDetails: ['POST /api/ai/page-audit/stream 不写入 AI 生成历史。', '体检结果包含综合评价、四个固定维度和最多五个按严重程度展示的问题。', '关闭抽屉或点击停止会中止浏览器请求，服务端同时取消上游模型调用。', '定位问题后关闭抽屉并选中对应组件，文本或按钮可直接使用现有 AI 文案助手。'],
    tests: ['biz-editor-server 与 biz-editor-fe typecheck/build 通过，新增前端文件 ESLint 通过。', '使用 DeepSeek deepseek-v4-flash 真实体检秋季奶茶页，返回 82 分、四个固定维度和 4 条合法问题。', '前端请求映射明确跳过 l-image 的 src，服务端提示内容只包含受限页面元数据。', '点击“定位并修复”后抽屉关闭、目标组件被选中且右侧 AI 文案助手可用。', '运行体检和停止请求后作品均保持“已保存”，画布文案未发生变化。', '收紧图片叠加规则后，模型不再把文字叠图直接判断为严重遮挡，只保留需确认对比度的不确定性提示。'],
    nextStep: '完成真实模型和浏览器验证后，AI 页面优化闭环即可作为演示项目的收尾能力。',
  },
  {
    id: 'editor-toolbar-responsive-polish',
    category: '编辑器',
    title: '编辑器工具栏响应式优化',
    summary: '解决作品 UUID 换行、操作按钮拥挤和发布入口被右侧面板遮挡的问题。',
    background: 'AI 生成和 AI 优化入口加入后，原单行工具栏在中等宽度下空间不足，作品信息被压缩换行，右侧关键操作超出画布区域。',
    goals: ['作品标题、状态和保存信息保持清晰。', '中等宽度下所有关键操作完整可见。', '极窄中心区域优先显示 AI、预览、保存和发布。'],
    decision: '使用 canvas-region 容器查询而非只依赖浏览器宽度，让工具栏根据两侧面板占用后的真实可用空间切换布局。',
    keyDesigns: ['宽屏保持单行，中等宽度切换为信息行加操作行。', 'UUID 显示为首尾短标识，悬浮可查看完整作品 ID。', '窄宽度将 AI 和预览按钮压缩为带 Tooltip 的图标。', '极窄宽度优先排列关键业务操作，缩放和历史允许横向查看。'],
    implementation: '已重构 canvas-toolbar 信息区样式，增加命名容器、1100px 与 760px 两级容器断点及紧凑按钮标签。',
    implementationDetails: ['工具栏不再使用固定 52px 高度，中等宽度采用 92px 双层布局。', '操作区域保持单行且不覆盖右侧设置面板。', '保存和发布始终保留文字，避免关键操作只剩难识别图标。'],
    tests: ['biz-editor-fe typecheck/build 通过。', '1000x700 视口下浏览器确认标题、短 ID、保存和发布完整可见。', '紧凑模式下 AI 与预览保留可访问名称和 Tooltip。', 'git diff --check 通过，生产构建仅保留既有的大包体积提示。'],
    nextStep: '工具栏已覆盖当前演示宽度，不继续扩展移动端编辑能力。',
  },
  {
    id: 'ai-page-copy-optimization',
    category: '实施计划',
    title: 'AI 整页文案优化',
    summary: '基于当前画布的全部可见文案，统一优化标题、正文、卖点和 CTA，并支持逐项或一次性应用。',
    background: '完整页面生成和单组件文案助手已经可用，但页面精修时仍缺少跨组件上下文，容易出现标题、正文与按钮语气不一致的问题。',
    goals: ['读取当前页最多 20 个文本和按钮组件。', '输出按组件 ID 映射的前后差异与修改原因。', '支持逐项应用和一键应用，一键应用可通过一次撤销整体恢复。'],
    decision: '新增轻量 SSE 接口和编辑器抽屉，不新增聊天页面或数据库记录；模型只提出候选，服务端负责组件归属、长度和事实片段校验。',
    keyDesigns: ['优化目标支持统一品牌表达、增强转化节奏、整页精简和自定义。', '隐藏组件、图片组件和空文案不会发送给模型。', '未知组件 ID、重复建议、超长文案和修改数字单位的建议会被服务端丢弃。', '一键应用把多个 props.text 补丁写入同一条“AI 整页优化”历史。'],
    implementation: '已新增整页优化 DTO、鉴权 SSE 接口、前端请求类型、差异预览抽屉和编辑器批量文案操作。',
    implementationDetails: ['工具栏新增“AI 优化”，与“AI 生成”抽屉互斥打开。', '结果卡展示组件类型、名称、原文、建议、修改原因和应用状态。', '逐项应用复用“AI 替换文案”历史，一键应用生成一条整页历史。', '应用只改变组件文案，不修改样式、坐标、事件，也不会自动触发保存或发布。', '所有模型请求增加 90 秒服务端超时，浏览器停止或断开时会取消上游请求。', '官方 DeepSeek 的文案任务关闭默认高强度思考，页面 Agent 继续保留推理；其他 OpenAI 兼容供应商不会收到 DeepSeek 专用参数。', '模型或校验失败会在抽屉中持续展示错误卡片，不再只依赖瞬时 toast。', 'AI 修改撤销回保存基线后会恢复“已保存”状态并解除手动保存锁。'],
    tests: ['biz-editor-server 与 biz-editor-fe typecheck/build 通过，新增前端文件 ESLint 通过。', '使用 DeepSeek deepseek-v4-flash 对 5 个文案组件生成整页方案，图片组件未发送；返回 3 项带组件归属、前后差异和原因的建议。', '逐项应用后画布文案正确更新；一键应用同时更新 3 个组件，一条历史记录可整体恢复全部原文。', 'AI 修改等待 7 秒仍保持未保存且未发起保存，撤销回基线后状态恢复为已保存。', '停止生成后加载状态立即结束，画布原文不变。', '关闭 DeepSeek 默认高强度思考后，最小请求约 0.54 秒，完整整页 SSE 约 3.13 秒，浏览器端约 4.43 秒。', 'git diff --check 通过，生产构建仅保留既有的大包体积提示。'],
    nextStep: '整页文案闭环已可演示；后续可增加 AI 页面体检评分，但不建议继续扩大当前功能范围。',
  },
  {
    id: 'ai-copy-assistant',
    category: '实施计划',
    title: 'AI 文案助手',
    summary: '在编辑器属性面板中为文本和按钮组件提供单句 AI 改写能力，生成候选后由用户选择应用，并保留撤销能力。',
    background: 'AI 落地页 Agent 可以生成完整草稿，但用户继续精修某一段标题、正文或按钮时，重新描述整页成本较高，需要更轻量的局部创作工具。',
    goals: ['针对当前文本生成 3 个差异化候选。', '支持润色、缩短、增强行动感、切换语气和自定义要求。', 'AI 替换保持可撤销，不改变组件的样式、位置和事件。'],
    decision: '在现有属性面板内嵌文案助手，复用 Bearer 鉴权和 OpenAI 兼容 SSE 通道；服务端约束模型只返回结构化文案，不为局部改写增加聊天或历史模块。',
    keyDesigns: ['入口仅对 l-text 和 l-button 显示。', '服务端校验组件类型和输入长度，并限制按钮最多 20 个字符。', '提示词禁止修改价格、数量、事实和活动规则；服务端再次校验数字与单位组成的事实片段。', '点击候选只更新 props.text，历史记录统一标记为“AI 替换文案”。'],
    implementation: '已新增 AI 文案 SSE 接口、前端请求封装、属性面板候选交互和编辑器原子替换操作。',
    implementationDetails: ['POST /api/ai/copy-suggestions/stream 复用现有登录鉴权和服务端模型配置。', '前端展示当前文案、五种修改模式、自定义补充要求、生成状态、停止操作和 3 个候选。', '助手按组件 ID 隔离状态，切换选中组件时会中止仍在执行的请求并清空旧候选，避免旧结果应用到新组件。', '现有作品加载增加 Store 水合保护，热更新后 Store 为空时会重新加载作品，并在加载完成前禁止脏状态判断和自动保存，避免空画布覆盖服务端内容。'],
    tests: ['biz-editor-server 与 biz-editor-fe typecheck 通过。', '使用 DeepSeek deepseek-v4-flash 真实生成 3 个候选，应用后画布和属性表单同步更新并进入未保存状态，撤销可恢复原文。', '首次联调发现模型把“500 名”改为其他单位；增加服务端事实校验后，重新生成的 3 个候选均保留“500 名”。', '按钮组件显示文案助手和按钮标签，图片组件不显示入口；从文本切换到按钮后旧候选已清空。', '对已有 6 组件作品触发 Vite 热更新并等待自动保存窗口，组件和原文均保持，未出现空画布覆盖。'],
    nextStep: '完成真实浏览器联调后，可继续增加基于整页上下文的标题、卖点和 CTA 成套文案建议。',
  },
  {
    id: 'ai-landing-page-agent',
    category: '实施计划',
    title: 'AI 落地页生成 Agent',
    summary: '在编辑器中接入 OpenAI 兼容模型、流式工具调用与可确认应用的页面草稿，形成真实 AI 全栈闭环。',
    background: '编辑器已有组件、保存、发布和统计能力，但缺少能展示 LLM API、流式交互、Tool Use 和结果持久化的 AI 应用链路。',
    goals: ['让用户以活动需求生成可编辑页面，而非单独聊天。', '模型能力通过受控工具输出到现有三种组件。', '保留最近创作记录，便于复盘和项目展示。'],
    decision: '服务端以 OpenAI 兼容 Chat Completions SSE 代理模型，模型调用页面构建工具，服务端再强制执行草稿校验工具。',
    keyDesigns: ['AI 不直接保存或覆盖作品，用户确认后才应用到画布。', '生成记录按用户隔离并限制最新 20 条。', '模型密钥仅存在 API 容器环境变量中。'],
    implementation: '已新增 ai NestJS 模块、流式页面草稿接口、Mongo 生成记录和编辑器 AI Agent 抽屉。',
    implementationDetails: ['工具只允许构建 l-text、l-image、l-button 三种组件。', '前端显示状态、文本流、工具调用结果、预览和可复用历史草稿。', 'AI 草稿应用后暂停编辑器原有的 5 秒自动保存，只有用户点击保存、发布或发布模板时才写入作品。', '候选草稿支持输入差异化修改要求生成新版本，并可撤回上一版；从历史打开草稿时会恢复原始需求上下文。', '已有作品中的 AI 草稿默认创建为新作品，也可明确选择替换当前画布，避免误覆盖原作品。', '远程 AI 主图导致封面生成超过 5 秒时自动降级为无封面保存，避免作品长期卡在保存中。'],
    tests: ['biz-editor-server typecheck/build 与 biz-editor-fe 生产构建通过。', '用临时 OpenAI 兼容 SSE 模型联调，验证文本流、页面构建工具、服务端校验工具、6 个组件草稿和用户历史查询。', '未配置模型时验证接口仅返回安全的 SSE 配置提示。', '使用 DeepSeek deepseek-v4-flash 完成真实浏览器联调：品牌宣传需求按顺序执行页面构建与两次草稿校验，生成 6 个组件并写入历史。', '浏览器确认草稿应用后替换标题、描述和画布，状态变为未保存，未自动触发保存或发布。', '从奶茶历史草稿输入差异化要求继续生成，模型保留原主视觉与卖点，只修改标题、暖棕配色和 CTA；新版本可撤回并以修改版写入历史。', '从已有作品选择“创建为新作品”后跳转到无作品 ID 的 /editor，标题、描述和 6 个组件正确加载；等待 7 秒仍为未保存，原作品未被更新。', 'AI 新作品手动保存后生成独立 UUID，随后发布成功；H5 页面正确渲染主图、标题、正文、卖点和 CTA，控制台无错误。'],
    nextStep: '继续用商品种草和活动报名需求做展示级验证；首期功能闭环已可演示。',
  },
  {
    id: 'deployment-details-guide',
    category: '实施计划',
    title: '部署细节手册与入口',
    summary: '在开发记录右侧新增部署细节入口，将当前 Docker 镜像与 Compose 编排方式沉淀为可阅读的部署手册。',
    background: '项目已具备本地生产模拟能力，但 Docker 初学者难以从 Compose 文件直接理解每个服务如何构建、连接和维护。',
    goals: ['说明五个应用和 MongoDB 的职责与端口。', '解释 Dockerfile、Compose、环境变量和数据卷之间的关系。', '提供首次发布、更新、排错和安全操作的可执行步骤。'],
    decision: '使用独立页面承载完整部署手册，并在仓库保留对应 Markdown 文档；入口放在顶部开发记录按钮右侧。',
    keyDesigns: ['部署手册按服务地图、镜像、编排、环境变量、首次启动、运维和排错分段。', '展示的变量与命令均对应当前 docker-compose.prod.yml 和 package.json。', '明确 Mongo 仅在 Docker 内网访问、volume 不会随普通 down 删除。'],
    implementation: '已新增 /deployment 页面、顶部入口和 docs/deployment-details.md，支持桌面目录与移动端阅读。',
    implementationDetails: ['前端镜像采用 Vite 构建产物加 Nginx，Node 服务采用多阶段构建。', '通过部署命令卡片和常见问题降低首次使用 Docker 的门槛。'],
    tests: ['biz-editor-fe 生产构建通过。', '浏览器确认开发记录右侧的部署细节入口、八个章节和服务地图正常渲染。', '390px 移动端宽度下确认页面无横向溢出，目录和内容切换为单列阅读。'],
    nextStep: '实际部署到云主机时，再补充反向代理和 HTTPS 的服务器配置示例。',
  },
  {
    id: 'deployment-demo-seed-and-mongo-isolation',
    category: '实施计划',
    title: '部署演示数据初始化与 Mongo 隔离',
    summary: '为 Docker 部署补充幂等演示数据初始化命令，并取消 MongoDB 的宿主机端口暴露。',
    background: '演示内容此前仅存在开发数据库中，新的部署环境会是空库；同时 MongoDB 端口映射不符合线上最小暴露原则。',
    goals: ['新环境可一键生成可演示的作品和模板。', '重复初始化不产生重复内容。', '数据库仅允许容器内部服务访问。'],
    decision: '使用 biz-editor-server 编译产物中的独立 seed 脚本写入固定标题的演示数据，并以标题加作品类型做幂等更新。',
    keyDesigns: ['初始化创建演示账号、六份已发布作品及六份公开模板。', 'Docker Compose 移除 Mongo ports 映射。', '部署文档将初始化命令纳入首次启动流程。'],
    implementation: '已新增 seed:demo-content 脚本并更新 Compose 和部署文档。',
    implementationDetails: ['脚本从容器环境读取 MONGODB_URI。', '模板保留完整 H5 内容、封面和 CTA 埋点。'],
    tests: ['biz-editor-server typecheck 与 build 通过。', 'Docker Compose 启动后 API 健康检查和首页访问通过。', '容器内连续执行两次 seed 后，演示账号为 1 个、作品 6 份、公开模板 6 份，重复记录为 0。'],
    nextStep: '部署时按文档执行初始化命令，即可直接进行模板到发布的演示。',
  },
  {
    id: 'homepage-first-visit-demo-guide',
    category: '实施计划',
    title: '首页首次访问演示引导',
    summary:
      '首页右下角新增轻量悬浮引导，为第一次访问的用户说明从模板到发布的完整体验路径。',
    background:
      '项目功能已完整，但首次访问者可能不知道应从模板市场、编辑器还是作品列表开始体验，需要一个不打断浏览的入口建立演示路径。',
    goals: [
      '首次访问自动呈现清晰的三步体验说明。',
      '引导可直达热门模板区域或进入工作台。',
      '用户关闭后不再自动打扰，但可随时重新打开。',
    ],
    decision:
      '采用固定右下角悬浮卡，而非遮罩弹窗；关闭状态写入 localStorage，收起后仅保留星光圆形入口。',
    keyDesigns: [
      '三步路径：选择模板、编辑内容、发布并查看效果。',
      '浏览热门栏目按钮平滑滚动至模板区域。',
      '开始体验复用既有登录与工作台跳转逻辑。',
      '桌面与移动端均避开主内容区，使用同一蓝白视觉体系。',
    ],
    implementation:
      'HomePage 新增 DemoGuide 组件及关闭状态持久化，样式包含入场动效、关闭按钮和收起入口。',
    implementationDetails: [
      '使用 ai-editor.demo-guide-dismissed 保存用户关闭偏好。',
      '引导不会阻塞模板筛选、轮播或使用模板流程。',
    ],
    tests: [
      'biz-editor-fe typecheck 和 production build 通过。',
      '浏览器桌面端确认引导首次展开、滚动至热门栏目、关闭为小入口、重新打开均正常。',
      '390px 移动端确认关闭状态持久化且页面无横向溢出，控制台无应用错误。',
    ],
    nextStep:
      '演示时首次打开首页即可按引导完成模板、编辑、发布和统计的主流程。',
  },
  {
    id: 'showcase-content-expansion',
    category: '实施计划',
    title: '模板市场与作品示例内容扩充',
    summary:
      '新增六套不同运营场景的优美 H5 作品，并各自沉淀为可直接使用的公开模板，丰富演示内容密度。',
    background:
      '模板市场此前仅有四份模板，分类虽完整但首页轮播与筛选的内容丰度不足，不利于展示平台的覆盖能力。',
    goals: [
      '补充不重复的视觉主题和运营场景。',
      '每份内容同时保留独立作品与可复用模板。',
      '所有模板均包含完整首屏、权益信息、CTA 和 H5 发布快照。',
    ],
    decision:
      '以摄影主视觉叠加编辑器原生文字、信息卡和按钮组件；每组采用独立色板、叙事和行动目标，避免模板市场出现同质化卡片。',
    keyDesigns: [
      '春日慢集：暖杏与珊瑚红的城市市集邀约。',
      '留白之家：鼠尾草绿的家居品牌发布。',
      '夜光里程：深蓝荧光的城市夜跑报名。',
      '花间练习：柔粉色的周末花艺课程。',
      '去海边吧：海盐蓝的初夏轻旅行。',
      '晨光俱乐部：奶油棕的咖啡会员福利。',
    ],
    implementation:
      '六份作品及六份公开模板均已写入真实 works 数据，每份模板可在首页筛选、预览和使用。',
    implementationDetails: [
      '公开模板由 4 份增加到 10 份，已发布非模板作品共 14 份。',
      '新增内容覆盖营销活动、节日促销、品牌宣传、招聘报名、新品发布、报名收集和商品种草。',
      '每份 CTA 均配置点击埋点及演示跳转地址。',
    ],
    tests: [
      '公开模板接口返回 10 条记录，标签映射完整。',
      '春日慢集 H5 发布地址返回 200 并包含预加载主视觉。',
      'MongoDB 核对已发布作品 14 份、公开模板 10 份。',
    ],
    nextStep:
      '演示时从首页按分类浏览模板，选择任意模板进入编辑器后展示二次创作与发布流程。',
  },
  {
    id: 'stable-template-category-navigation',
    category: '实施计划',
    title: '模板栏目稳定筛选与横向导航',
    summary:
      '修复模板栏目随当前筛选结果缩减的问题，补齐七个运营分类的真实模板，并在标签较多时提供左右切换。',
    background:
      '首页原先从当前模板请求的返回结果生成标签。切换到某个栏目后，其他标签可能不再出现在结果中，造成栏目数量变少且无法继续切换。',
    goals: [
      '模板栏目在任意筛选状态下保持完整稳定。',
      '营销活动、节日促销、品牌宣传、招聘报名、新品发布、报名收集和商品种草均有可用模板。',
      '固定模板展示区在内容超过可见数量时支持左右翻页。',
    ],
    decision:
      '栏目采用固定产品分类而不是从列表结果动态推导；模板卡片区域采用固定列数横向轮播，并保留左右按钮作为显式翻页控制。',
    keyDesigns: [
      '切换分类只改变查询参数，不再影响分类导航本身。',
      '模板区域在桌面、平板、手机分别显示四张、两张、一张卡片，超过可见数量可切换下一组。',
      '秋日咖啡模板覆盖营销活动、节日促销和新品发布。',
      '城市灵感夜模板覆盖招聘报名和报名收集。',
      '品牌焕新与修护精华模板分别覆盖品牌宣传和商品种草。',
    ],
    implementation:
      '首页固定展示七个栏目；已有四份公开模板已完成分类补齐，模板卡片在固定展示区内可左右平滑切换。',
    implementationDetails: [
      'HomePage 使用 ref 控制模板卡片轮播容器。',
      '轮播容器隐藏滚动条，保留鼠标、触控和按钮三种切换方式。',
      '左右翻页按钮提供无障碍标签。',
    ],
    tests: [
      'biz-editor-fe typecheck 通过。',
      'biz-editor-fe production build 通过，仅保留既有首包体积提示。',
      'MongoDB 已核对四份公开模板的七类标签映射。',
      '浏览器确认首页七个栏目稳定显示，切换品牌宣传后只展示对应模板。',
      '390px 移动端确认模板轮播内容可横向切换且页面无横向溢出，控制台无应用错误。',
    ],
    nextStep:
      '演示前按 pnpm dev:local 启动服务，并从首页依次演示模板筛选、使用、编辑和发布。',
  },
  {
    id: 'public-cases-and-template-metrics',
    category: '实施计划',
    title: '首页优秀案例与模板真实热度指标',
    summary:
      '首页新增只供预览的优秀案例区域，并将模板浏览、收藏、使用三个指标接入服务端真实数据和热门排序。',
    background:
      '首页热门栏目应承载可复用模板，而优秀作品需要独立展示以提供灵感。此前浏览量为占位符、收藏仅保存在 localStorage，热门排序缺少可靠的数据基础。',
    goals: [
      '公开作品以优秀案例形式展示，只允许预览，不提供一键使用。',
      '模板浏览量由 H5 page_view 自动累计。',
      '模板收藏按登录用户持久化，并保证重复收藏幂等。',
      '热门排序综合运营推荐、收藏量、浏览量和使用量。',
    ],
    decision:
      'Work 冗余 viewCount 和 favoriteCount 供列表高效读取；收藏关系单独存储在 work_favorites 并用 workUuid + user 唯一索引保证幂等。',
    keyDesigns: [
      'GET /public/works/cases 只查询 Published、isTemplate=false、isPublic=true 的作品。',
      'POST page_view 在保存 WorkVisit 后同步递增 Work.viewCount。',
      '登录用户通过收藏关系接口收藏或取消收藏，匿名用户跳转登录。',
      '热门排序依次参考 isHot、favoriteCount、viewCount、copiedCount 和发布时间。',
      '优秀案例卡与模板卡采用不同按钮文案和交互，防止作品被误认为可复用模板。',
    ],
    implementation:
      '服务端指标、收藏接口、公开案例接口和首页案例区域均已落地，三份示例作品已设为公开案例。',
    implementationDetails: [
      '新增 WorkFavorite schema 及唯一索引。',
      'Work schema 新增 viewCount、favoriteCount，并同步 admin-server schema。',
      'useFavoriteTemplates 改用 React Query 服务端状态及乐观更新。',
      '首页模板卡展示真实浏览、收藏和使用数量。',
      '首页新增三列优秀案例卡，使用环境变量配置的 H5 地址打开预览。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'admin-server typecheck 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      '真实 page_view 联调确认 viewCount 递增。',
      '重复收藏联调确认 favoriteCount 保持 1，幂等约束生效。',
      '公开案例接口返回品牌宣传、商品种草、报名收集三份作品。',
      '历史 works 数据已回填 viewCount=0 和 favoriteCount=0。',
      '首页收藏与取消收藏浏览器验证通过，卡片收藏数按 0 → 1 → 0 实时更新。',
      '390px 移动端浏览器复验通过，三张案例卡均存在且页面无横向溢出，控制台无应用错误。',
    ],
    nextStep:
      '补充收藏列表页面和案例后台精选开关，进一步形成运营管理闭环。',
  },
  {
    id: 'three-polished-demo-works',
    category: '实施计划',
    title: '三类优美示例作品创建记录',
    summary:
      '围绕品牌宣传、商品种草和报名收集分别创建并发布一套完整 H5 作品，用于验证编辑器在不同运营场景下的表现力。',
    background:
      '作品列表已有咖啡活动案例，但还缺少品牌、商品与线索收集三类常见运营场景，无法直观展示模板市场和编辑器的内容覆盖能力。',
    goals: [
      '品牌宣传采用克制高级的空间品牌视觉。',
      '商品种草采用生活方式编辑感和明确商品卖点。',
      '报名收集采用清晰活动信息卡和强行动 CTA。',
      '所有背景资产内嵌到发布快照，避免第三方图片链接失效。',
    ],
    decision:
      '使用竖版摄影素材作为主视觉，中文标题、卖点、信息卡和按钮全部使用编辑器原生组件叠加，保证清晰度和后续可编辑性。',
    keyDesigns: [
      '品牌宣传使用深色空间摄影、香槟金点缀和半透明服务卡。',
      '商品种草使用沙漠植物产品摄影、暖米色编辑排版和深绿购买按钮。',
      '报名收集使用社群活动摄影、珊瑚橙强调色和结构化报名信息卡。',
      '三个 CTA 均配置点击埋点，报名 CTA 额外配置外部报名链接示例。',
      '三个作品分别沉淀为品牌宣传、商品种草、报名收集公开模板，并通过管理后台设为首页推荐。',
    ],
    implementation:
      '三个作品均已创建、生成封面并发布，随后通过真实 H5 页面完成视觉检查和排版修正。',
    implementationDetails: [
      '序场空间｜品牌焕新计划：5c658c4d-a578-4ce5-b0f1-01d9cc12f2ca。',
      '荒漠绿洲｜修护精华种草指南：9d92bb43-8d33-46d8-a94c-c3d7c7e4a7bd。',
      '城市灵感夜｜青年创意者招募：ff8227d5-a215-4c02-820b-1f3ab88fb7f0。',
      '摄影素材压缩到 375px H5 实际画布尺寸并以 data URL 保存，满足接口请求体限制。',
    ],
    tests: [
      '三个作品创建接口和发布接口均返回成功，状态为 Published。',
      '三个 H5 地址均返回并渲染完整页面，浏览器控制台无 error 或 warning。',
      '已检查背景裁切、文字对比度、信息卡层级和 CTA 位置。',
      '已根据首轮浏览器截图修正标题、卖点和报名字段的断行。',
      '公开模板接口按热门排序返回 4 条，新三条均为 isHot=true、isPublic=true。',
      '首页浏览器验证三张推荐模板卡片可见，共有 4 个“使用模板”入口，控制台无错误。',
    ],
    nextStep:
      '可根据运营需要把三个作品分别发布为公开模板，并将报名 CTA 替换为真实表单地址。',
  },
  {
    id: 'publish-template-as-independent-work',
    category: '实施计划',
    title: '模板发布为独立作品修复',
    summary:
      '修复模板状态为 Published 但仍被作品列表过滤的问题，让模板编辑器中的“发布作品”创建或更新独立作品。',
    background:
      '作品列表固定查询 isTemplate=false。旧逻辑遗留模板以及直接编辑模板的场景中，点击发布只会把模板本身设为 Published，因此仍无法在“我的作品”中看到。',
    goals: [
      '普通作品继续原地发布。',
      '模板发布作品时生成独立的非模板作品。',
      '同一模板重复发布时更新已有作品，避免重复生成。',
      '发布成功后编辑器切换到独立作品 UUID。',
      '修复当前账号的遗留咖啡模板数据。',
    ],
    decision:
      '新增 sourceTemplateUuid。publish 接口检测到 isTemplate=true 时按用户与来源模板幂等创建或更新 Published 作品；前端在返回 UUID 变化时切换编辑地址。',
    keyDesigns: [
      '模板和作品分别保留独立 UUID、内容快照、渠道与统计。',
      '发布模板不会修改模板的 isTemplate 或公开状态。',
      '衍生作品使用 isTemplate=false、status=Published，并记录 sourceTemplateUuid。',
      '重复发布保留已有作品渠道，只刷新内容、封面和发布快照。',
    ],
    implementation:
      '服务端模板发布分支、共享 schema 字段和编辑器 UUID 切换逻辑已完成。',
    implementationDetails: [
      'WorksService.publish 增加 publishTemplateAsWork 分支。',
      'biz-editor-server 与 admin-server Work schema 同步 sourceTemplateUuid。',
      'EditorPage 检测返回 UUID 变化，跳转到新作品并显示明确成功提示。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'admin-server、admin-fe 和 biz-editor-fe typecheck 通过。',
      'biz-editor-fe build 通过，仅保留既有首包体积提示。',
      '真实咖啡模板首次发布生成独立作品 e627b17d-2bc9-4f91-ad17-4f09485e4240。',
      '同一模板第二次发布返回同一作品 UUID，幂等更新验证通过。',
      '接口确认当前账号同时保留 1 个作品和 1 个模板，作品 isTemplate=false、status=Published。',
      '浏览器登录后访问 /works，确认“秋日咖啡新品发布会”卡片与“已发布”状态均可见。',
    ],
    nextStep:
      '验证模板重复发布复用同一作品 UUID，并确认作品列表、H5 地址和模板列表同时正常。',
  },
  {
    id: 'independent-template-copy',
    category: '实施计划',
    title: '作品发布为独立模板副本',
    summary:
      '将发布为模板从修改作品分类改为创建独立模板副本，保证原作品、模板发布快照和统计数据彼此独立。',
    background:
      '旧逻辑直接把同一条 Work 的 isTemplate 改为 true，导致作品从“我的作品”消失并进入“我的模板”，不符合用户对作品沉淀模板的预期。',
    goals: [
      '发布为模板后原作品继续保留在作品列表。',
      '模板使用独立 UUID、发布快照、公开状态和统计数据。',
      '同一作品重复发布模板时更新已有副本，避免产生重复模板。',
      '直接编辑已有模板时继续更新模板本身。',
    ],
    decision:
      '新增 sourceWorkUuid 记录模板来源。普通作品首次发布时创建 Published 模板副本，后续按用户与 sourceWorkUuid 更新；已有模板调用同一接口时原地重新发布。',
    keyDesigns: [
      '原作品的 isTemplate、status、publishedContent 和 copiedCount 均不因发布模板而改变。',
      '模板副本复制标题、描述、编辑内容和封面，并立即生成 publishedContent。',
      '公开模板仍遵守 isTemplate=true、isPublic=true、status=Published 的查询约束。',
      '业务服务与管理服务同步 sourceWorkUuid schema，避免共享 works collection 字段漂移。',
    ],
    implementation:
      '服务端 markAsTemplate 已改为独立副本与幂等更新语义，编辑器发布成功后继续保持原作品上下文。',
    implementationDetails: [
      'Work schema 新增 sourceWorkUuid 索引字段。',
      '首次发布创建独立模板 UUID，重复发布刷新已有模板内容及发布快照。',
      '编辑器不再把 currentWork 切换为返回的模板副本，避免后续保存或渠道操作误作用于模板。',
      'admin 模板列表返回 sourceWorkUuid，支持后续展示来源追踪。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'admin-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      'admin-fe typecheck 通过。',
      '真实接口首次发布验证通过：原作品保持 isTemplate=false，模板使用独立 UUID 且 sourceWorkUuid 指向原作品。',
      '真实接口重复发布验证通过：第二次返回同一模板 UUID，并刷新模板标签，没有生成重复模板。',
      '模板副本状态为 Published 且包含 publishedContent，满足公开模板查询和 H5 预览约束。',
      '联调创建的临时作品和模板已删除，未改动现有业务数据。',
    ],
    nextStep:
      '完成真实接口联调后，可在“我的模板”和管理后台详情中增加“来源作品”跳转。',
  },
  {
    id: 'react-bits-homepage-polish',
    category: '实施计划',
    title: 'React Bits 风格首页轻量动效试验',
    summary:
      '参考 React Bits 的动态背景、文本入场和 SpotlightCard 思路，在不改变首页信息架构的前提下增强模板市场的视觉层次。',
    background:
      '当前首页功能闭环完整，但 Hero 和模板卡片的动态反馈偏弱。React Bits 适合提供动效思路，但直接叠加多个 WebGL 组件会增加移动端负担并抢夺模板内容注意力。',
    goals: [
      '为 Hero 增加低饱和、低频率的暖色动态氛围。',
      '让主标题、说明、搜索框和热门搜索形成清晰的首次加载节奏。',
      '为模板卡片增加跟随指针的局部聚光反馈。',
      '保证移动端可用，并响应 prefers-reduced-motion。',
    ],
    decision:
      '采用 React Bits 官方推荐的源码引入模式，正式落地 Aurora、BlurText 和 SpotlightCard，并只安装源码实际需要的 ogl 与 motion。',
    keyDesigns: [
      'Hero 保留现有背景图，使用 React Bits Aurora WebGL 渐变和轻量噪点叠加氛围。',
      '标题按语义短句分段渐显，后续内容按 120ms 左右的节奏依次进入。',
      'SpotlightCard 通过 CSS 自定义属性记录光标位置，不进入 React state，避免 mousemove 触发组件重渲染。',
      '减少动态效果模式下关闭所有入场和漂移动画，并直接展示最终状态。',
    ],
    implementation:
      'React Bits 正式组件已落地到首页 Hero 和公开模板卡片，保持搜索、筛选、收藏、预览和使用模板交互不变。',
    implementationDetails: [
      '新增 React Bits Aurora、BlurText、SpotlightCard 三个 TypeScript 源码组件及组件 CSS。',
      'Aurora 与 BlurText 使用 React.lazy 拆分加载，避免 ogl 与 motion 进入首页主包。',
      '新增 ogl 和 motion 直接依赖；没有安装 react-bits 运行时整包。',
      'App.css 保留首页业务层样式和 reduced-motion 降级，删除试验版的模拟 Aurora 和标题动画。',
      '首页渲染时单独解除 body 的 1024px 最小宽度，修复移动端横向溢出，同时保留编辑器桌面工作区限制。',
    ],
    tests: [
      'biz-editor-fe typecheck 通过。',
      'biz-editor-fe build 通过；仅保留既有的首包体积提示。',
      '浏览器桌面首屏验证通过，标题、背景、搜索和能力条均正常显示。',
      '热门搜索“海报”交互验证通过，搜索框与模板空状态同步更新。',
      '390px 移动端验证通过，页面 scrollWidth 与 clientWidth 一致，无横向溢出。',
      '浏览器控制台无应用 error 或 warning。',
      '首页本次改动无新增 lint 问题；全量 lint 仍被 TransferWorkModal、EditorPage 和 NotesPage 的既有规则错误阻塞。',
      '正式集成后确认 Hero 内存在 Aurora WebGL canvas、标题由 BlurText 渲染，公开模板由 SpotlightCard 包裹。',
      '正式组件桌面端与 390px 移动端浏览器复验通过，干净页面控制台无 error 或 warning。',
      '生产构建确认 Aurora 与 BlurText 独立拆包，gzip 约 15KB 和 40KB。',
    ],
    nextStep:
      '根据实际页面观感决定是否保留当前强度，再考虑为能力条增加一次性滚动显现。',
  },
  {
    id: 'requirement-loop',
    category: '需求分析',
    title: '从创建作品到发布访问的业务闭环',
    summary: '一期先跑通登录、创建、编辑、保存、发布、H5 访问和统计反馈。',
    background:
      '营销作品平台不是单纯编辑器，创建和发布之后还要能访问、治理和统计，业务才算闭环。',
    goals: [
      '明确一期核心链路，避免一开始就陷入完整平台化。',
      '区分普通用户、运营人员、管理员和访客的使用场景。',
      '把输入、生产、发布、访问、治理、统计串成闭环。',
    ],
    decision:
      '把 B 端编辑器、H5 展示端、管理后台和统计系统拆成独立模块，按阶段实现。',
    keyDesigns: [
      'B 端负责作品生产，包括登录、作品列表、模板、编辑器、保存和发布。',
      'H5 端负责高性能访问，后续采用 SSR，并复用业务组件和渲染协议。',
      '后台管理负责治理能力，包括作品下线、用户冻结、模板上下架。',
      '统计系统作为业务闭环，后续支持 PV、渠道、分享、组件点击和 OpenAPI。',
    ],
    implementation:
      '当前已优先建设 B 端编辑器的核心生产能力，后续再接作品 API、H5 SSR 和后台治理。',
    implementationDetails: [
      '先搭建编辑器工作台，让作品 JSON 的创建和编辑能力跑起来。',
      '页面设置、图层设置、属性设置都围绕作品 JSON 和组件数据结构展开。',
      '保留作品、模板、开发记录等路由入口，为后续业务模块接入留出位置。',
    ],
    tests: [
      '确认编辑器能添加组件并形成作品内容。',
      '确认新增路由后 /editor 仍可作为默认生产工作台。',
      '确认开发记录页面能持续沉淀需求和方案。',
    ],
    nextStep: '补作品列表、保存发布接口、H5 渲染服务和基础统计上报。',
  },
  {
    id: 'monorepo-architecture',
    category: '架构设计',
    title: 'Monorepo 与多端项目边界',
    summary: '用 apps 和 packages 区分应用与可复用能力。',
    background:
      '项目包含 B 端、H5、管理后台、组件库和统计服务，单仓库需要清晰的边界。',
    goals: [
      '让大型全栈项目能够分阶段初始化，做到哪个模块再初始化哪个模块。',
      '避免 B 端、H5、后台、组件库之间互相耦合。',
      '让公共协议和渲染能力能被多个应用复用。',
    ],
    decision:
      '应用放在 apps，公共协议、组件、渲染器和 SDK 放在 packages，所有项目使用 TypeScript。',
    keyDesigns: [
      'apps/biz-editor-fe 承载 B 端编辑器。',
      'packages/biz-components 承载业务展示组件。',
      '后续 packages/editor-schema 承载作品 JSON 协议，renderer-core 承载 JSON 到 React 的渲染逻辑。',
      '所有项目统一 TypeScript，根 tsconfig 作为基础约束。',
    ],
    implementation:
      '已初始化 monorepo，并优先建设 biz-editor-fe 和 packages/biz-components。',
    implementationDetails: [
      '根目录作为 workspace，项目目录统一放在 Ai-editor-project 下。',
      'biz-editor-fe 使用 Vite、React 19、Ant Design 6、Zustand 和 TypeScript。',
      '业务组件库独立打包发布，为后续 H5 SSR 复用做准备。',
    ],
    tests: [
      '确认 pnpm workspace 能对单个 app 执行 typecheck 和 build。',
      '确认业务组件库和编辑器前端能独立安装依赖、独立构建。',
    ],
    nextStep: '继续补 editor-schema、renderer-core 和服务端项目初始化。',
  },
  {
    id: 'business-components',
    category: '组件库',
    title: '业务组件库复用编辑器与 H5',
    summary: '画布组件和 H5 渲染组件必须同源，避免两套渲染逻辑。',
    background:
      '编辑器画布看到的内容应该和 H5 访问结果一致，否则后续维护成本会快速上升。',
    goals: [
      '让编辑器画布和 H5 页面复用同一批业务组件。',
      '组件库不依赖编辑器状态，只接受 props 渲染。',
      '为发布 npm、CI/CD 和多项目使用建立独立流程。',
    ],
    decision:
      '抽离业务组件库，组件属性采用平铺 props，组件自身只负责展示，不依赖编辑器状态。',
    keyDesigns: [
      '属性采用平铺结构，例如 text、color、fontSize，而不是 css 对象嵌套。',
      '组件库只做展示和通用行为，画布选择、拖动、缩放都放在编辑器 Wrapper。',
      '每个业务组件独立实现，编辑器通过 registry 和 schema 适配。',
    ],
    implementation:
      '已初始化并发布 @zhangli2008/ai-editor-components，当前编辑器保留本地兼容渲染。',
    implementationDetails: [
      '确定包名为 @zhangli2008/ai-editor-components。',
      '完成 npm token、发布权限和 provenance 元信息处理。',
      '编辑器中保留本地 LText、LImage、LButton 兼容实现，方便继续迭代交互。',
    ],
    tests: [
      '本地执行组件库 typecheck 和 build。',
      'npm publish dry-run 检查包内容。',
      '发布后在编辑器项目中安装并验证依赖可解析。',
    ],
    nextStep: '逐步把本地组件切换到组件库，并沉淀统一 schema。',
  },
  {
    id: 'schema-driven-props',
    category: '编辑器',
    title: '属性面板由 schema 驱动',
    summary: '组件属性通过 schema 渲染成不同表单控件，并支持分组折叠。',
    background:
      '组件属性越来越多，写死表单会导致判断复杂、扩展性差。',
    goals: [
      '让新增组件属性时尽量只改 schema，不改表单结构。',
      '让不同类型属性映射到不同 Ant Design 表单控件。',
      '属性较多时按特性分组，避免右侧面板变成长列表。',
    ],
    decision:
      '使用 propSchema 描述字段、控件类型和分组，右侧面板通过 Collapse 聚合展示。',
    keyDesigns: [
      'PropSchema 包含 field、label、component、group、options、min、max、step 等信息。',
      '固定分组包括基础属性、尺寸、边框、阴影与透明度、位置、事件功能。',
      'PropField 负责根据 schema.component 渲染 Input、Select、Slider、Radio 等控件。',
      '表单变更统一调用 updateComponent 或 updateClickEvent，最终写回 store。',
    ],
    implementation:
      '已支持 Input、TextArea、InputNumber、Color、Select、Radio、Slider 等控件。',
    implementationDetails: [
      '文本组件支持文本、颜色、字号、字重、字体、行高、对齐方式和布局字段。',
      '图片组件支持 src、alt、objectFit、borderRadius 和布局字段。',
      '按钮组件支持文字、颜色、背景、字号、圆角、位置和事件设置。',
      '属性面板默认展开基础属性和位置，空分组不渲染。',
    ],
    tests: [
      '选择不同组件时，只显示当前组件拥有的字段分组。',
      '修改字段后，画布实时响应。',
      '事件功能中的 eventName 和 url 修改后能写入组件 events。',
    ],
    nextStep: '增加属性搜索、常用属性收藏和更细的样式分组。',
  },
  {
    id: 'layer-page-settings',
    category: '编辑器',
    title: '图层设置与页面设置',
    summary: '右侧设置区拆成组件属性、图层设置、页面设置三个工作面。',
    background:
      '编辑器不只改单个组件，还需要管理图层顺序、隐藏锁定和页面级背景配置。',
    goals: [
      '把右侧设置区从单一属性表单升级为多工作面。',
      '让图层管理和页面设置成为作品编辑的一等能力。',
      '让图层拖拽和画布顺序保持一致。',
    ],
    decision:
      '一个组件对应一个图层，页面设置作为作品级配置，不污染组件 props。',
    keyDesigns: [
      '右侧 Tabs 分为组件属性、图层设置、页面设置。',
      '图层顺序直接复用 components 数组，数组最后一项是顶层。',
      '图层元信息 layerName、isHidden、isLocked 放在 ComponentData 顶层。',
      '页面设置 pageSetting 包含背景色、背景图、重复方式、背景大小和页面高度。',
    ],
    implementation:
      '已实现图层拖拽排序、隐藏锁定、名称编辑和页面背景/高度设置。',
    implementationDetails: [
      '图层列表使用 dnd-kit 支持整行拖拽排序。',
      '隐藏图层时画布不渲染该组件，锁定图层时画布不可选中和拖动。',
      '图层名称点击后进入输入态，支持 Enter 保存、Esc 取消、点击外部保存。',
      '页面设置只影响 page-canvas，不污染编辑器灰色网格背景。',
    ],
    tests: [
      '图层点击后同步选中画布组件和属性面板。',
      '隐藏、锁定、删除、重命名图层能正确影响画布。',
      '拖拽图层后画布 zIndex 和纵向位置同步变化。',
      '修改页面背景和高度后，page-canvas 实时更新。',
    ],
    nextStep: '补批量操作、分组图层和页面设置保存协议。',
  },
  {
    id: 'canvas-interaction',
    category: '画布交互',
    title: '绝对定位、拖动和缩放',
    summary: '画布元素使用 left/top/width/height 表达真实布局状态。',
    background:
      '块级自上而下排列无法满足 H5 搭建器的精确设计需求。',
    goals: [
      '把组件从文档流排列改为画布内绝对定位。',
      '拖动和缩放都只修改组件 props 中的样式数据。',
      '保证编辑器画布和未来 H5 渲染可以使用同一套位置信息。',
    ],
    decision:
      '组件在 page-canvas 内绝对定位，拖动修改 left/top，缩放修改尺寸和位置。',
    keyDesigns: [
      'CanvasElement 是业务组件外层 Wrapper，负责选中、删除、拖动和缩放。',
      'pointerdown 记录起始指针和组件 rect，pointermove 实时计算新值。',
      '拖动限制在 page-canvas 内，避免组件超出页面区域。',
      '缩放只放四个角手柄，四个方向分别计算 left、top、width、height。',
    ],
    implementation:
      '已支持拖动、四角缩放、边界限制、锁定不可操作和删除按钮图标化。',
    implementationDetails: [
      '拖动过程中调用 updateComponentPosition 实时更新画布和右侧坐标。',
      '拖动结束时调用 commitComponentPosition 记录一次历史 patch。',
      '缩放过程中调用 updateComponentRect 实时更新尺寸。',
      '缩放结束时调用 commitComponentRect，一次性记录 left/top/width/height 的变化。',
    ],
    tests: [
      '拖动组件时画布跟随移动，右侧 X/Y 坐标同步。',
      '拖到边缘时不能超出 page-canvas。',
      '四角缩放能正确改变尺寸，左上/右上方向会同步改变位置。',
      '锁定图层后无法通过画布拖动或缩放。',
    ],
    nextStep: '补参考线、吸附、等比缩放、多选和键盘微调反馈。',
  },
  {
    id: 'operation-history',
    category: '历史系统',
    title: '撤销重做从快照升级为操作日志',
    summary: '历史记录改为只保存修改数据，按 patch 执行 undo/redo。',
    background:
      '全量快照简单但不利于学习操作类型，也不适合后续大型作品性能优化。',
    goals: [
      '让历史记录能说明“发生了什么操作”。',
      '只保存被修改的数据，而不是每次保存完整作品快照。',
      '让拖动、缩放这类一次操作能同时回滚多个字段。',
    ],
    decision:
      '定义 HistoryRecord 和 HistoryPatch，记录新增、删除、属性修改、页面设置和排序。',
    keyDesigns: [
      'HistoryRecord 包含 id、type、label、timestamp、patches、selectionBefore、selectionAfter。',
      'HistoryPatch 支持 component-add、component-delete、component-prop、component-field、page-setting、component-order。',
      'undo 从 historyPast 取出记录，按 oldValue 或反向操作回滚。',
      'redo 从 historyFuture 取出记录，按 newValue 或正向操作重放。',
      'mergeKey + 300ms 合并快速连续修改，保留第一次 oldValue 和最后一次 newValue。',
    ],
    implementation:
      '已支持操作日志、快速修改合并、最大 50 条记录、Popover 查看历史栈。',
    implementationDetails: [
      '新增组件记录 add patch，撤销时删除组件，重做时按原 index 插回。',
      '删除组件记录 delete patch，撤销时恢复组件和图层位置。',
      'updateComponent 支持单字段和多字段更新。',
      '页面设置、图层排序、事件修改都进入统一历史系统。',
      'Ctrl/Cmd+Z 和 Ctrl/Cmd+Shift+Z 通过 hotkeys-js 触发 undo/redo。',
    ],
    tests: [
      '新增、删除、属性修改、页面设置、图层排序均可撤销重做。',
      '拖动只生成一条历史，缩放只生成一条历史。',
      '快速修改同一字段会合并历史记录。',
      'undo 后继续编辑会清空 redo 栈。',
      '输入框聚焦时 Ctrl/Cmd+Z 仍能触发编辑器撤销。',
    ],
    nextStep: '补单元测试、历史记录可视化详情和跨会话持久化方案。',
  },
  {
    id: 'ci-cd',
    category: '工程化',
    title: '组件库发布与 CI/CD',
    summary: '业务组件库通过 GitHub Actions 自动检查并发布 npm。',
    background:
      '组件库要服务多个项目，需要独立的构建、类型检查和发布流程。',
    goals: [
      '让业务组件库代码 push 后自动执行质量检查。',
      '让 npm 发布流程可重复、可追踪、避免手动遗漏。',
      '把发布 token 放在平台密钥里，不提交到仓库。',
    ],
    decision:
      '使用 GitHub Actions 替代 Travis，main 分支触发构建和发布流程。',
    keyDesigns: [
      'CI 执行 pnpm install、typecheck、build 和 npm publish dry-run。',
      'CD 使用 npm granular access token，并开启 Bypass 2FA for publishing。',
      'package.json 补 repository 元信息，支持 npm provenance。',
    ],
    implementation:
      '已配置 npm token、provenance 相关信息和组件库发布动作。',
    implementationDetails: [
      '尝试 Travis 后发现仓库触发状态不稳定，切换到 GitHub Actions。',
      '配置 NPM_TOKEN 到 GitHub Secrets。',
      '组件库发布包名使用 @zhangli2008/ai-editor-components。',
    ],
    tests: [
      'GitHub Actions 在 main 分支 push 后能触发。',
      'typecheck、build 和 publish dry-run 正常通过。',
      'npm 包发布后可在编辑器项目安装使用。',
    ],
    nextStep: '补版本策略、changeset 和更明确的发布审批机制。',
  },
  {
    id: 'upload-image-flow',
    category: '编辑器',
    title: '图片上传到画布的一期闭环',
    summary: '左侧上传入口选择图片后，模拟上传成功并自动创建图片组件。',
    background:
      '编辑器需要让用户从本地添加图片，但一期还没有后端上传 API 和 OSS 服务。',
    goals: [
      '先跑通选择图片、得到 URL、添加到画布的最小闭环。',
      '上传能力放在编辑器侧，不进入业务组件库。',
      '后续接 OSS/API 时只替换上传服务，不改画布和 store 流程。',
    ],
    decision:
      '使用 Ant Design Upload 处理文件选择和校验，uploadImage 先用 URL.createObjectURL 返回本地预览地址。',
    keyDesigns: [
      'Upload 限制 accept=image/*，maxCount=1，showUploadList=false。',
      'uploadImage(file) 返回 url、name、size、type。',
      '上传成功后调用 addUploadedImage 创建 l-image 组件。',
      '新增图片默认设置 src、alt、label、width、height、objectFit 和 borderRadius。',
    ],
    implementation:
      '左侧组件资产面板已包含上传图片入口，选择图片后会在画布中显示图片组件并自动选中。',
    implementationDetails: [
      '非图片文件会通过 beforeUpload 阻止并提示错误。',
      '图片组件仍沿用当前 LImage 渲染，不改变组件库发布流程。',
      '上传入口在“全部”和“媒体”分类中展示。',
    ],
    tests: [
      '选择图片后画布出现图片组件。',
      '右侧属性面板能修改 src、alt、尺寸和填充方式。',
      '删除上传图片组件后画布和图层同步移除。',
    ],
    nextStep: '接入真实上传 API、进度反馈、失败重试和资源库管理。',
  },
  {
    id: 'app-routing-notes',
    category: '工程化',
    title: '从单页编辑器升级为应用路由框架',
    summary: '接入 react-router，新增编辑器、开发记录、作品和模板页面。',
    background:
      '随着功能增加，单个 App 页面无法承载作品管理、模板中心和技术记录等多个入口。',
    goals: [
      '建立完整 B 端产品框架，而不是只有编辑器工作台。',
      '让开发记录成为项目知识库，持续沉淀每一步技术方案。',
      '为作品列表和模板中心预留清晰路由。',
    ],
    decision:
      '使用 BrowserRouter、Routes、Route、Navigate 和 NavLink 搭建声明式路由。',
    keyDesigns: [
      '/editor 承载当前编辑器。',
      '/notes 承载开发记录。',
      '/works 和 /templates 先作为占位工作台。',
      '全局 Header 放品牌、主导航和主要动作，编辑器页只负责工作区内容。',
    ],
    implementation:
      '已拆出 EditorPage、NotesPage、WorksPage、TemplatesPage，并新增 learningNotes 静态数据。',
    implementationDetails: [
      'App.tsx 从编辑器主体改为全应用路由壳。',
      'main.tsx 使用 BrowserRouter 包裹 App。',
      '顶部导航使用 NavLink 自动高亮当前页面。',
      'NotesPage 使用 Tabs + Timeline + Card 展示分类开发记录。',
    ],
    tests: [
      '/ 会自动跳转 /editor。',
      '/editor、/notes、/works、/templates 均可访问和刷新。',
      '编辑器添加组件功能在路由拆分后仍可用。',
      '窄屏下无明显水平溢出。',
    ],
    nextStep: '将开发记录支持 Markdown 导入、搜索、锚点和方案版本追踪。',
  },
  {
    id: 'monorepo-typescript-plan',
    category: '实施计划',
    title: '项目 Monorepo 初始化与 TypeScript 全栈约定计划',
    summary:
      '先创建 Ai-editor-project 根项目，用 pnpm workspace 管理 apps 和 packages，并约定所有子项目统一使用 TypeScript。',
    background:
      '项目会同时包含 B 端编辑器、服务端、H5 展示端、管理后台、业务组件库和统计服务，必须先把仓库边界定清楚，后续才能一期一期扩展。',
    goals: [
      '创建独立的 Ai-editor-project 项目目录，避免直接污染 workspace 根目录。',
      '用 apps 承载业务应用，用 packages 承载可复用模块。',
      '所有项目统一 TypeScript，保证前后端协议和组件数据结构可持续演进。',
      '先搭空架子，具体项目做到哪个再初始化哪个。',
    ],
    decision:
      '采用 monorepo，而不是多个独立仓库；根目录只放工程配置、技术文档和 workspace 声明。',
    keyDesigns: [
      'apps/biz-editor-fe 作为 B 端编辑器前端。',
      'apps/biz-editor-server 作为 B 端接口服务。',
      'packages/biz-components 作为编辑器和 H5 复用的业务组件库。',
      '后续 H5、admin、统计服务按阶段继续放入 apps 或 packages。',
      '技术方案沉淀为 Markdown 和开发记录页面，保证思路可追溯。',
    ],
    implementation:
      '计划已完成。当前仓库已经以 Ai-editor-project 作为根目录，并开始承载前端、组件库和服务端项目。',
    implementationDetails: [
      '初始化根 package.json 和 pnpm-workspace.yaml。',
      '创建 apps 与 packages 目录。',
      '先保留未开发模块的目录规划，不提前生成大量空项目。',
      '将整体技术方案写入文档，并在后续通过 /notes 页面继续沉淀。',
    ],
    tests: [
      '确认 pnpm 能识别 workspace 内子项目。',
      '确认 GitHub 仓库能正常关联和推送。',
      '确认后续新增 app/package 不需要改变根目录结构。',
    ],
    nextStep: '继续把公共 schema、渲染器和更多后端服务按模块补齐。',
  },
  {
    id: 'biz-editor-fe-init-plan',
    category: '实施计划',
    title: 'biz-editor-fe 初始化与 Ant Design 6 接入计划',
    summary:
      '用 Vite 初始化 React 19 + TypeScript 前端项目，并接入 Ant Design 6 作为 B 端编辑器的基础 UI 体系。',
    background:
      'B 端编辑器需要大量表单、Tabs、Collapse、Upload、Popover 等成熟控件，直接使用组件库能把精力放在编辑器业务和画布交互上。',
    goals: [
      '快速搭建可运行的编辑器前端项目。',
      '使用 React 19、Vite、TypeScript 和 Ant Design 6。',
      '保留后续接入 Zustand、路由、图层、页面设置的空间。',
      '让本地开发、类型检查和构建命令可稳定执行。',
    ],
    decision:
      '选择 Vite 作为前端构建工具，Ant Design 6 作为主 UI 组件库，Zustand 作为编辑器局部复杂状态管理方案。',
    keyDesigns: [
      '编辑器页面采用左中右三栏结构。',
      '左侧承载组件模板和上传入口。',
      '中间承载 page-canvas 画布。',
      '右侧承载属性设置、图层设置和页面设置。',
      '状态管理聚焦编辑器 store，不把所有 UI 状态都提升到全局。',
    ],
    implementation:
      '计划已完成。当前 biz-editor-fe 已经运行在 Vite + React 19 + Ant Design 6 基础上。',
    implementationDetails: [
      '初始化 Vite React TypeScript 项目。',
      '安装 Ant Design 6、lucide-react、Zustand 等前端依赖。',
      '建立编辑器 store、组件注册表、画布渲染和设置面板雏形。',
      '后续逐步加入路由、开发记录、图层、页面设置和历史系统。',
    ],
    tests: [
      '启动 dev server 后能访问编辑器页面。',
      '执行 biz-editor-fe typecheck 通过。',
      '执行 biz-editor-fe build 通过。',
      '新增 Ant Design 控件后样式和交互正常。',
    ],
    nextStep: '继续拆分编辑器模块，减少 EditorPage 单文件复杂度。',
  },
  {
    id: 'biz-components-init-publish-plan',
    category: '实施计划',
    title: '业务组件库初始化、文本组件与 npm 发布计划',
    summary:
      '初始化 packages/biz-components，先创建文本组件并发布到 npm，为编辑器和 H5 共用组件打基础。',
    background:
      '画布使用的组件和 H5 页面渲染组件必须一致，否则编辑器所见和用户访问结果会逐渐分叉。',
    goals: [
      '创建独立业务组件库项目。',
      '先实现可发布的文本组件，验证打包链路。',
      '发布 npm 包，验证外部项目可安装使用。',
      '为后续图片、按钮、形状和复杂组件留出扩展方式。',
    ],
    decision:
      '包名采用 @zhangli2008/ai-editor-components；组件库只负责展示，不包含编辑器拖动、选中、缩放等交互。',
    keyDesigns: [
      '组件 props 采用平铺结构，方便作品 JSON 保存和编辑器更新。',
      'Rollup/Vite library build 输出可被前端项目消费的 JS 模块。',
      '组件库独立 typecheck、build 和 publish。',
      '编辑器通过 registry 适配组件，而不是让组件库依赖编辑器 store。',
    ],
    implementation:
      '计划已完成。业务组件库已经初始化并完成 npm 发布验证。',
    implementationDetails: [
      '创建 packages/biz-components 项目。',
      '实现基础 LText 组件和类型定义。',
      '处理 npm 登录、granular access token、2FA publish bypass 和包名权限。',
      '在编辑器项目中安装包，验证依赖可以解析。',
    ],
    tests: [
      '组件库 typecheck 通过。',
      '组件库 build 生成产物。',
      'npm publish dry-run 检查包内容。',
      '真实发布后 npm registry 可查询并安装该包。',
    ],
    nextStep: '把编辑器本地组件逐步替换为组件库组件，并补 Storybook 或示例页面。',
  },
  {
    id: 'components-ci-cd-plan',
    category: '实施计划',
    title: '业务组件库 CI/CD 自动发布计划',
    summary:
      '为业务组件库增加自动化检查和发布流程，最终从 Travis 方案切换到 GitHub Actions。',
    background:
      '组件库会被编辑器和 H5 多端依赖，手动发布容易遗漏构建、类型检查、版本和 token 安全问题。',
    goals: [
      '每次代码推送后自动安装依赖、类型检查和构建。',
      '发布前执行 npm publish dry-run，提前发现包内容问题。',
      '把 npm token 放到 CI 平台密钥，不提交到仓库。',
      '让 main 分支合入后能自动发布组件库。',
    ],
    decision:
      '最初设计 Travis CI tag 发布；实际接入中 Travis 触发状态不稳定，因此切换到 GitHub Actions，并使用 GitHub Secrets 管理 NPM_TOKEN。',
    keyDesigns: [
      'CI 使用 pnpm 10 固定包管理器版本。',
      '流程只针对 @zhangli2008/ai-editor-components 执行 typecheck、build、dry-run 和 publish。',
      'NPM_TOKEN 使用 granular access token，并开启 Bypass 2FA for publishing。',
      'package.json 补 repository 元信息，以支持 npm provenance。',
    ],
    implementation:
      '计划已完成。GitHub Actions 已经成功触发组件库 CI/CD。',
    implementationDetails: [
      '先添加 Travis 配置，设计 tag-gated npm deploy。',
      '排查 Travis 页面无构建记录的问题。',
      '切换到 GitHub Actions，并让 main 分支 push 触发流程。',
      '用户手动填入 GitHub Secrets 后，CI 成功运行。',
    ],
    tests: [
      'push main 后 GitHub Actions 自动启动。',
      '依赖安装、typecheck、build、dry-run 通过。',
      '发布步骤能读取 NPM_TOKEN。',
      'npm 包元信息包含 repository，provenance 不再报错。',
    ],
    nextStep: '引入 changesets 管理版本，避免每次 main 合入都产生不可控发布。',
  },
  {
    id: 'upload-image-flow-plan',
    category: '实施计划',
    title: '左侧图片上传到画布流程计划',
    summary:
      '在左侧组件模板库新增上传图片入口，选择图片后模拟上传成功并自动创建图片组件。',
    background:
      '编辑器需要支持用户上传图片素材，但一期没有后端上传 API 和 OSS，所以应先打通前端最小闭环。',
    goals: [
      '左侧支持选择本地图片。',
      '上传成功后得到一个 url。',
      '自动向画布添加 l-image 组件。',
      '右侧属性面板可以继续编辑图片属性。',
    ],
    decision:
      '使用 Ant Design Upload 处理文件选择和校验；一期用 URL.createObjectURL 模拟上传成功返回 URL。',
    keyDesigns: [
      '上传能力放在 apps/biz-editor-fe，不放入 packages/biz-components。',
      '抽象 uploadImage(file) 服务，后续接 OSS/API 时只替换实现。',
      'addUploadedImage 根据上传结果生成图片组件。',
      '新图片默认设置 src、alt、label、width、height、objectFit 和 borderRadius。',
    ],
    implementation:
      '计划已完成。左侧资产面板已有上传入口，图片选择后会立即出现在画布。',
    implementationDetails: [
      'Upload 设置 accept=image/*、maxCount=1、showUploadList=false。',
      'beforeUpload 校验非图片文件并提示错误。',
      '上传成功后自动选中新建图片组件。',
      '画布继续使用当前 LImage 渲染，不影响组件库发布流程。',
    ],
    tests: [
      '选择图片后画布出现图片组件。',
      '新图片图层自动出现在图层设置中。',
      '右侧属性面板能修改 src、alt、宽高和填充方式。',
      '选择非图片文件时不添加组件并提示错误。',
    ],
    nextStep: '接真实上传服务、上传进度、失败重试和素材库管理。',
  },
  {
    id: 'layer-settings-enhancement-plan',
    category: '实施计划',
    title: '右侧图层 Tab 与图层增强计划',
    summary:
      '右侧设置面板增加图层设置 Tab，并支持选中、隐藏、锁定、重命名、删除和拖拽排序。',
    background:
      '一个作品会包含多个组件，用户需要像设计工具一样管理组件层级和可见性。',
    goals: [
      '一个组件对应一个图层。',
      '图层点击后同步选中画布组件。',
      '支持隐藏、显示、锁定、解锁、重命名和删除。',
      '支持拖拽排序，并让画布顺序同步变化。',
    ],
    decision:
      '不单独设计 layers 数据结构，直接复用 components 数组；图层元信息放在 ComponentData 顶层。',
    keyDesigns: [
      '右侧 Tabs 包含组件属性和图层设置。',
      'ComponentData 增加 layerName、isHidden、isLocked。',
      '隐藏组件不渲染，锁定组件可见但画布不可选中操作。',
      '拖拽排序更新 components 数组顺序，zIndex 由数组顺序决定。',
      '拖动图层后同步更新组件 top，兼顾层级和简单纵向布局。',
    ],
    implementation:
      '计划已完成。图层列表已支持整行拖拽、图标操作、名称编辑和状态切换。',
    implementationDetails: [
      '将图层设置放在右侧，而不是左侧组件模板区。',
      '上移、下移按钮被拖拽排序替代。',
      '使用可点击图标呈现隐藏、锁定、删除和拖动。',
      '名称编辑支持 Enter 保存、Esc 取消、点击外部保存。',
    ],
    tests: [
      '点击图层后画布选中态和属性面板同步。',
      '隐藏当前选中图层后组件消失并清空选中。',
      '锁定后画布点击不会选中该组件。',
      '拖拽图层后图层顺序和画布层级同步。',
      '删除图层后对应画布组件消失。',
    ],
    nextStep: '补多选图层、分组、批量隐藏锁定和拖拽排序单元测试。',
  },
  {
    id: 'props-collapse-plan',
    category: '实施计划',
    title: '组件属性分组 Collapse 面板计划',
    summary:
      '把右侧组件属性从平铺表单升级为分组折叠面板，让大量属性更易管理。',
    background:
      '文本、图片、按钮组件的属性会持续增加，如果继续平铺展示，右侧面板会越来越长，用户也难以定位属性。',
    goals: [
      '属性仍由 propSchema 驱动。',
      '通过 schema 增加 group 信息完成分组。',
      '使用 Ant Design Collapse 呈现分组。',
      '修改任意字段后仍实时更新画布。',
    ],
    decision:
      '扩展 PropSchema.group，而不是在 UI 层写死字段归类；未声明 group 的字段默认进入基础属性。',
    keyDesigns: [
      '固定分组包括 basic、size、border、shadowOpacity、position、event。',
      '基础属性承载 label、text、src、alt、颜色、字体、对齐等常用字段。',
      '尺寸分组承载 width 和 height。',
      '位置分组承载 left 和 top。',
      '事件功能分组承载 eventName、url 等点击事件字段。',
      '默认展开 basic 和 position，不启用严格 accordion。',
    ],
    implementation:
      '计划已完成。属性面板已按分组折叠展示，并继续复用 PropField 渲染控件。',
    implementationDetails: [
      'PropField 保留 Input、TextArea、InputNumber、Color、Select、ButtonRadio、Radio、Slider。',
      '渲染前按 group 聚合当前组件 schema。',
      '空分组不展示，避免图片组件看到文本专属字段。',
      '设置面板自身滚动，不撑开整页布局。',
    ],
    tests: [
      '文本组件属性按基础、尺寸、位置等分组显示。',
      '图片组件只显示自己拥有字段的分组。',
      '按钮组件的事件字段位于事件功能分组。',
      '修改 Collapse 内字段后画布实时更新。',
    ],
    nextStep: '增加属性搜索、常用属性置顶和复杂属性编辑器。',
  },
  {
    id: 'page-settings-tab-plan',
    category: '实施计划',
    title: '右侧页面设置 Tab 计划',
    summary:
      '在右侧设置面板新增页面设置 Tab，用于编辑作品页面自身的背景、背景图和高度。',
    background:
      '组件属性只能描述单个组件，作品还需要页面级配置，例如背景色、背景图片和页面高度。',
    goals: [
      '页面设置不依赖当前选中的组件。',
      '支持背景色、背景图、背景重复、背景大小和页面高度。',
      '页面设置只影响真实页面区域，不污染编辑器外壳。',
      '空画布时也能看到页面背景效果。',
    ],
    decision:
      '新增 pageSetting 作为作品级状态；画布拆出内层 page-canvas 承载真实页面背景和高度。',
    keyDesigns: [
      'pageSetting 包含 backgroundColor、backgroundImage、backgroundRepeat、backgroundSize、height。',
      'updatePageSetting(key, value) 统一更新页面配置。',
      'canvas-stage 保留编辑器灰色网格背景。',
      'page-canvas 承载真实页面背景，并作为组件绝对定位容器。',
      '背景图片一期先用 URL 输入，不复用上传组件。',
    ],
    implementation:
      '计划已完成。右侧已有页面设置 Tab，修改后画布页面区域实时响应。',
    implementationDetails: [
      '背景颜色使用 color input 和常用色 swatch。',
      '背景重复和背景大小使用 Select。',
      '页面高度使用 InputNumber，限制最小值。',
      '修复设置面板滚动撑开整页和添加组件后容器跳动问题。',
    ],
    tests: [
      '修改背景色后 page-canvas 实时变色。',
      '输入背景图 URL 后能显示背景图。',
      '切换 repeat 和 size 后背景样式变化。',
      '修改高度后 page-canvas 高度变化且组件仍正常显示。',
    ],
    nextStep: '页面设置后续进入作品保存协议，并支持背景图上传和裁剪。',
  },
  {
    id: 'canvas-drag-move-plan',
    category: '实施计划',
    title: '画布拖动移动元素计划',
    summary:
      '组件在 page-canvas 内绝对定位，通过拖动实时修改 props.left 和 props.top。',
    background:
      'H5 搭建器需要精确布局，块级元素自上而下排列无法满足自由设计和还原需求。',
    goals: [
      '组件移动只改变 left 和 top。',
      '拖动过程中画布实时移动。',
      '右侧位置属性实时同步。',
      '拖动不改变图层顺序。',
      '锁定组件不能通过画布拖动。',
    ],
    decision:
      '拖动交互放在 CanvasElement 外层 Wrapper，使用 PointerEvent 实现，不进入业务组件库。',
    keyDesigns: [
      'pointerdown 记录指针起点、元素初始 left/top、画布尺寸和元素尺寸。',
      'pointermove 计算偏移并更新 left/top。',
      'pointerup 或 pointercancel 结束拖动。',
      '坐标限制在 page-canvas 内，并取整数避免小数像素。',
      '删除上移/下移按钮，位置移动统一通过拖动或属性面板完成。',
    ],
    implementation:
      '计划已完成。组件可在画布内自由拖动，并且位置变化进入历史系统。',
    implementationDetails: [
      '新增 updateComponentPosition 和 commitComponentPosition。',
      '拖动过程使用临时更新，结束时生成一条历史记录。',
      '拖动中使用 grabbing cursor，并禁用文本选中和图片原生拖拽干扰。',
      '点击删除图标不会触发拖动。',
    ],
    tests: [
      '拖动文本、图片、按钮均能移动。',
      '右侧 X/Y 坐标实时变化。',
      '拖到边缘不能超出 page-canvas。',
      '锁定图层后无法拖动。',
      '拖动一次只生成一条历史记录。',
    ],
    nextStep: '补参考线、网格吸附、方向键移动和多选拖动。',
  },
  {
    id: 'canvas-resize-plan',
    category: '实施计划',
    title: '拖动改变组件大小计划',
    summary:
      '选中组件后显示四个角缩放手柄，拖动手柄修改 width、height，并按方向同步修正 left/top。',
    background:
      '只有拖动位置还不够，编辑器必须让用户在画布上直接调整组件尺寸，而不是只能在右侧输入宽高。',
    goals: [
      '创建四个角 handler。',
      '支持左上、右上、左下、右下四个方向缩放。',
      '缩放结果写回组件 props 的 width、height、left、top。',
      '缩放过程受 page-canvas 边界限制。',
      '缩放不改变图层顺序。',
    ],
    decision:
      '缩放能力继续放在 CanvasElement Wrapper，不进入业务组件库；使用 pointer 事件统一鼠标和触控板交互。',
    keyDesigns: [
      '四个 handler 使用绝对定位的小圆点。',
      '右下拖动只改变 width 和 height。',
      '左上拖动同时改变 left、top、width、height。',
      '右上和左下分别处理单轴位置修正。',
      '缩放结束时一次性提交多字段历史记录。',
    ],
    implementation:
      '计划已完成。选中组件后可以通过四角手柄调整大小。',
    implementationDetails: [
      '新增 updateComponentRect 和 commitComponentRect。',
      '缩放过程中实时更新画布和属性面板。',
      '缩放结束后记录 left/top/width/height 的操作日志。',
      '删除按钮改为右上角小图标，减少对画布内容的遮挡。',
      '图层拖拽从仅拖动图标升级为整行可拖。',
    ],
    tests: [
      '四个角拖动都能正确改变尺寸。',
      '左侧或上侧缩放时位置和尺寸同时变化。',
      '缩放不能让组件越界或出现负尺寸。',
      '锁定组件不显示缩放手柄。',
      '缩放一次只生成一条历史记录。',
    ],
    nextStep: '增加最小尺寸、等比缩放、中心缩放和尺寸吸附。',
  },
  {
    id: 'editor-hotkeys-plan',
    category: '实施计划',
    title: '编辑器快捷键操作计划',
    summary:
      '为选中组件增加复制、粘贴、删除、取消选中、方向键移动、撤销和重做快捷键。',
    background:
      '编辑器类产品需要键盘操作来提升效率，尤其是元素移动、复制删除和撤销重做。',
    goals: [
      'Ctrl/Cmd+C 复制当前选中组件。',
      'Ctrl/Cmd+V 粘贴组件到画布。',
      'Backspace/Delete 删除选中组件。',
      'Esc 取消选中。',
      '方向键移动 1 像素，Shift+方向键移动 10 像素。',
      'Ctrl/Cmd+Z 和 Ctrl/Cmd+Shift+Z 触发撤销重做。',
    ],
    decision:
      '使用 hotkeys-js 统一处理快捷键绑定，并封装 useEditorHotkeys Hook。',
    keyDesigns: [
      '快捷键只作用于编辑器当前 store 状态。',
      '复制时保存当前组件的数据结构，粘贴时生成新 id 并略微偏移位置。',
      '删除、移动、粘贴都进入历史系统。',
      '输入框聚焦时仍允许编辑器级撤销重做，避免 Ctrl/Cmd+Z 失效。',
    ],
    implementation:
      '计划已完成。当前编辑器已接入 useEditorHotkeys，并修复操作日志改造后的 Ctrl/Cmd+Z 失效问题。',
    implementationDetails: [
      '安装并接入 hotkeys-js。',
      '封装 useEditorHotkeys 读取 editorStore actions。',
      '移动快捷键调用位置更新和历史提交逻辑。',
      '撤销/重做直接调用 undo 和 redo。',
    ],
    tests: [
      '选中组件后复制粘贴生成新图层。',
      'Delete 删除组件并可撤销。',
      'Esc 清空当前选中组件。',
      '方向键和 Shift+方向键能改变 left/top。',
      'Ctrl/Cmd+Z 与 Ctrl/Cmd+Shift+Z 可用。',
    ],
    nextStep: '增加快捷键帮助面板，并支持用户自定义快捷键。',
  },
  {
    id: 'operation-history-plan',
    category: '实施计划',
    title: '撤销/重做操作日志方案计划',
    summary:
      '把全量快照 history 升级为只保存修改数据的操作日志，undo/redo 通过 patch 回滚和重放。',
    background:
      '快照式历史实现简单，但会保存大量冗余数据，也无法清晰表达新增、删除、移动、缩放、页面设置等操作类型。',
    goals: [
      '每次操作保存类型、旧值和新值。',
      '新增、删除、修改、页面设置、图层排序都能撤销重做。',
      '拖动和缩放这种一次操作可以回退多个字段。',
      '快速连续修改同一字段时合并历史。',
      '从历史中间继续编辑时清空 redo 栈。',
    ],
    decision:
      '定义 HistoryRecord 和 HistoryPatch，用 patch 表达局部数据变化；最大历史记录数限制为 50。',
    keyDesigns: [
      'HistoryRecord 包含 id、type、label、timestamp、patches。',
      'HistoryPatch 支持组件新增、删除、字段修改、页面设置修改、图层顺序修改。',
      'updateComponent 支持单字段和多字段更新。',
      'mergeKey + 300ms 合并快速输入，保留第一次 oldValue 和最后一次 newValue。',
      'undo 从 historyPast pop，redo 从 historyFuture pop。',
    ],
    implementation:
      '计划已完成。编辑器历史系统已切换到操作日志，并在 Popover 中展示记录。',
    implementationDetails: [
      '新增 recordHistory 和 applyHistoryRecord 内部工具。',
      '新增、删除、属性修改、事件修改、页面设置、图层排序都记录 patch。',
      '拖动提交 left/top 两个字段，缩放提交 left/top/width/height 四个字段。',
      '历史记录超过 50 条时移除最旧记录。',
      'undo 后继续编辑会清空 historyFuture。',
    ],
    tests: [
      '新增组件后撤销消失，重做恢复。',
      '删除组件后撤销按原位置恢复。',
      '修改文本、颜色、事件后只回滚对应字段。',
      '拖动一次只产生一条历史，撤销同时恢复 left/top。',
      '缩放一次只产生一条历史，撤销同时恢复尺寸和位置。',
      '页面设置可撤销重做。',
    ],
    nextStep: '为历史系统补单元测试，并增加单条历史详情展开。',
  },
  {
    id: 'history-popover-plan',
    category: '实施计划',
    title: '历史记录 Popover 展示优化计划',
    summary:
      '把画布工具栏上的撤销/重做历史栈改为鼠标悬浮 Popover 展示，并优化为竖向记录列表。',
    background:
      '历史栈直接铺在页面上会占据编辑器空间，但学习阶段又希望能观察每次操作日志。',
    goals: [
      '保留历史记录可视化，方便学习操作日志。',
      '不让历史栈长期占用画布区域。',
      '鼠标悬浮撤销/重做按钮时展示记录。',
      '记录以竖向列表展示，便于阅读。',
    ],
    decision:
      '使用 Ant Design Popover 包裹撤销和重做按钮，内容展示 historyPast 和 historyFuture。',
    keyDesigns: [
      'Popover 触发方式使用 hover。',
      '历史记录展示操作 label、类型和影响字段数量。',
      '列表竖向排列，限制最大高度并允许内部滚动。',
      '空记录时展示轻量空状态。',
    ],
    implementation:
      '计划已完成。画布右上角撤销/重做按钮已通过 Popover 展示历史记录。',
    implementationDetails: [
      '移除页面上常驻的历史栈展示。',
      'Popover 内容区统一样式、间距和分隔线。',
      '记录数量和字段数量用于观察操作日志是否按预期合并。',
    ],
    tests: [
      '鼠标移到撤销按钮显示可撤销记录。',
      '鼠标移到重做按钮显示可重做记录。',
      '历史记录竖向排列，不横向挤压。',
      '执行 undo/redo 后 Popover 内容同步变化。',
    ],
    nextStep: '支持点击历史记录跳转到某个历史点。',
  },
  {
    id: 'app-framework-ui-plan',
    category: '实施计划',
    title: '全应用框架 UI 与路由改造计划',
    summary:
      '把单一编辑器页面升级为 B 端产品框架，增加顶部导航和编辑器、开发记录、作品、模板路由。',
    background:
      '项目已经不只是一个画布 demo，还需要承载作品管理、模板管理和开发过程知识库。',
    goals: [
      '接入 react-router。',
      '规划 /editor、/notes、/works、/templates。',
      '编辑器页保持核心功能不回退。',
      '开发记录页成为项目知识库入口。',
      '作品和模板页先作为占位工作台。',
    ],
    decision:
      '使用顶部全局导航承载产品入口，编辑器保持专业工作台布局，视觉风格克制、清晰、工具化。',
    keyDesigns: [
      'App.tsx 作为路由壳。',
      'EditorPage 承载当前编辑器。',
      'NotesPage 使用 Tabs + Timeline 展示开发记录。',
      'WorksPage 和 TemplatesPage 先做占位，不接真实数据。',
      '顶部 Header 包含品牌、主导航和操作区。',
    ],
    implementation:
      '计划已完成。当前应用已支持多路由和开发记录页面。',
    implementationDetails: [
      '安装并接入 react-router。',
      '拆出 pages/EditorPage.tsx、NotesPage.tsx、WorksPage.tsx、TemplatesPage.tsx。',
      '新增 data/learningNotes.ts 承载静态开发记录。',
      '优化编辑器工作台 Header、左侧资产面板、画布工具栏和右侧设置区视觉。',
    ],
    tests: [
      '/ 自动跳转 /editor。',
      '四个主要路由可以访问并刷新。',
      '顶部导航当前页高亮正确。',
      '编辑器添加、拖动、缩放、图层、页面设置、撤销重做仍可用。',
      '窄屏下没有严重重叠和撑开整页。',
    ],
    nextStep: '把 WorksPage 和 TemplatesPage 接入真实服务端接口。',
  },
  {
    id: 'notes-detail-plan',
    category: '实施计划',
    title: '开发记录页详细化计划',
    summary:
      '把每一步技术方案沉淀成结构化记录，让项目结束时可以回顾需求、方案、实现和验证。',
    background:
      '聊天记录不适合作为长期项目知识库，重要决策需要沉淀到仓库中，方便后续查阅和复盘。',
    goals: [
      '记录需求分析、架构设计、组件库、编辑器、画布交互、历史系统、工程化和实施计划。',
      '每条记录包含背景、目标、决策、关键设计、实现和测试。',
      '页面上支持按分类筛选。',
      '后续每个重要计划都先记录，再执行。',
    ],
    decision:
      '先使用前端静态 learningNotes.ts，不引入 Markdown 解析和后端存储，保证实现轻量可控。',
    keyDesigns: [
      'LearningNoteCategory 作为分类枚举。',
      'LearningNote 统一描述一条技术记录或实施计划。',
      'NotesPage 复用 Ant Design Tabs、Timeline 和 Card。',
      '实施计划作为独立分类，与技术实现记录并存。',
    ],
    implementation:
      '计划已完成一部分。当前已经有开发记录页面和多条技术记录，本次继续补齐历史实施计划。',
    implementationDetails: [
      '新增 learningNotes.ts 静态数据源。',
      'NotesPage 根据分类筛选 records。',
      '使用 goals、keyDesigns、implementationDetails 和 tests 承载详细内容。',
      '本次补齐之前已经讨论或执行过的计划记录。',
    ],
    tests: [
      '/notes 页面正常渲染。',
      '切换分类后只展示对应记录。',
      '全部分类中能看到所有技术记录和实施计划。',
      '新增记录后 typecheck 和 build 通过。',
    ],
    nextStep: '支持从 Markdown 或后端加载记录，并增加搜索和锚点。',
  },
  {
    id: 'nestjs-mongoose-server-init-plan',
    category: '实施计划',
    title: 'NestJS + Mongoose 服务初始化计划',
    summary:
      '初始化 biz-editor-server，接入 NestJS 配置体系和 Mongoose，为作品后台接口做准备。',
    background:
      '作品保存、发布、复制、删除和模板管理都需要后端服务支撑，前端 mock 无法验证真实业务闭环。',
    goals: [
      '创建 biz-editor-server NestJS 项目。',
      '统一使用 TypeScript。',
      '通过环境变量配置 MongoDB 连接。',
      '提供健康检查接口，验证服务和数据库状态。',
      '为 WorksModule、UsersModule 和 AuthModule 留出模块化结构。',
    ],
    decision:
      '后端使用 NestJS 而不是 EggJS；数据库使用 MongoDB + Mongoose，更适合作品 JSON 这类文档型数据。',
    keyDesigns: [
      'ConfigModule 读取 .env。',
      'MongooseModule 建立 MongoDB 连接。',
      'HealthController 提供 /api/health 和 /api/health/mongo。',
      '服务端 package 独立 typecheck、build 和 start:dev。',
      '接口统一挂载 /api 前缀。',
    ],
    implementation:
      '计划已完成基础骨架。当前 biz-editor-server 已具备 NestJS、Mongoose 和 health 接口结构。',
    implementationDetails: [
      '创建 apps/biz-editor-server 项目文件。',
      '补 package.json、tsconfig、nest-cli 配置。',
      '新增 .env.example，约定 mongodb://127.0.0.1:27017/ai_editor。',
      '添加 AppModule、HealthModule 和 Mongo 连接状态检查。',
    ],
    tests: [
      'biz-editor-server typecheck 通过。',
      'biz-editor-server build 通过。',
      '启动服务后 GET /api/health 返回 ok。',
      'MongoDB 启动后 GET /api/health/mongo 返回 connected。',
    ],
    nextStep: '启动本地 Docker MongoDB，并实现 WorksModule 的第一版接口。',
  },
  {
    id: 'mongo-nest-worksmodule-plan',
    category: '实施计划',
    title: '本地 MongoDB + Nest 服务连通 + WorksModule 开发计划',
    summary:
      '先用 Docker 启动 MongoDB，验证 biz-editor-server 的 NestJS + Mongoose 连接，再开发 WorksModule。',
    background:
      '作品后台接口必须先验证本地数据库链路真实可用，否则直接开发 CRUD 容易出现接口能写但无法落库、发布流程无法验证的问题。',
    goals: [
      '用 Docker 在本地启动 MongoDB，避免污染本机环境。',
      '验证 biz-editor-server 能通过 Mongoose 连接 MongoDB。',
      '通过 /api/health 和 /api/health/mongo 确认服务与数据库状态。',
      '在连接打通后开发 WorksModule，承载作品和模板第一版接口。',
    ],
    decision:
      'MongoDB 使用 Docker 运行，不使用 Homebrew；连接地址保持 mongodb://127.0.0.1:27017/ai_editor；WorksModule 在 NestJS 中按 controller、service、schema、dto 分层实现。',
    keyDesigns: [
      'Mongo 容器名使用 ai-editor-mongo。',
      'Docker 端口映射为 27017:27017。',
      'Mongo 数据卷使用 ai-editor-mongo-data:/data/db。',
      '作品状态使用数字枚举：0 删除、1 未发布、2 已发布、3 管理员强制下线。',
      '作品模型保留 content 草稿内容，同时增加 publishedContent 发布快照。',
      '一期先使用 mock 用户信息，UsersModule 和 AuthModule 后置。',
    ],
    implementation:
      '计划已落地。当前已完成 Docker MongoDB、本地 Mongoose 连接验证和 WorksModule 第一版接口。',
    implementationDetails: [
      '使用 Docker 启动 mongo:7 容器并绑定 27017 端口。',
      '运行 biz-editor-server，通过 health/mongo 验证 Mongoose 连接状态为 connected。',
      '新增 WorkSchema，字段包含 uuid、title、desc、content、publishedContent、author、coverImg、status、isTemplate、isHot、copiedCount、isPublic、user、latestPublishAt。',
      '实现创建、列表、详情、保存、发布、复制、软删除和恢复接口。',
      '发布接口将 content 复制到 publishedContent，并把 status 更新为 2。',
      '删除接口只把 status 改为 0，不物理删除 MongoDB 文档。',
    ],
    tests: [
      'docker ps 能看到 ai-editor-mongo 容器。',
      'GET /api/health 返回 status=ok。',
      'GET /api/health/mongo 返回 status=connected。',
      'typecheck 和 build 通过。',
      '创建作品后 MongoDB 中能查询到数据。',
      '发布作品后 publishedContent 存在，并且 status=2。',
      '删除作品后 status=0，恢复后 status=1。',
    ],
    nextStep:
      '接入真实用户鉴权，将 mock 用户替换为登录态用户，并继续开发模板筛选和 H5 公开访问接口。',
  },
  {
    id: 'frontend-works-api-plan',
    category: '实施计划',
    title: '前端 Works API 接入与请求层封装计划',
    summary:
      '使用 fetch + TanStack Query 接入 Works API，让编辑器具备真实创建、保存、发布能力，作品页展示真实数据。',
    background:
      '后端 WorksModule 已经打通 MongoDB 落库，前端下一步需要从本地编辑器 demo 进入真实作品生产系统。请求封装不能只解决发请求，还要明确服务端状态、本地编辑状态和作品 JSON 协议之间的边界。',
    goals: [
      '新增统一请求层，集中管理 baseURL、JSON、query params 和错误处理。',
      '新增 Works 类型，明确 WorkStatus、WorkContent、Work 和分页结果结构。',
      '用 TanStack Query 管理作品列表、详情和 mutation 后刷新。',
      '编辑器保存和发布调用真实后端接口。',
      '作品列表页展示真实 MongoDB 数据，并支持编辑、复制、软删除和恢复。',
      '把本次方案沉淀到开发记录，方便项目结束时回顾请求层设计。',
    ],
    decision:
      '不引入 axios，使用原生 fetch 做薄封装；服务端状态交给 TanStack Query，本地画布编辑状态继续交给 Zustand。',
    keyDesigns: [
      'src/api/http.ts 提供 request<T>()，后续服务端响应格式变化时只改这一层。',
      'src/api/types.ts 定义 WorkStatus、WorkContent、Work、PageResult 和作品创建/更新参数。',
      'src/api/works.ts 同时提供 API 函数和 React Query hooks。',
      'queryKey 约定为 works 列表和 work 详情两类，mutation 成功后刷新 works 列表并写入详情缓存。',
      'WorkContent 使用 { components, props: pageSetting }，和最早讨论的作品 JSON 结构保持一致。',
      '/editor 是新建作品入口，/editor/:workId 是编辑已有作品入口。',
    ],
    implementation:
      '计划已落地。当前已新增 API 层、Works hooks、编辑器保存/发布接入、作品列表真实数据展示和本条开发记录。',
    implementationDetails: [
      '新增 request<T>()，默认 VITE_API_BASE_URL 为 http://127.0.0.1:7001/api。',
      '新增 useWorksQuery、useWorkQuery、useCreateWorkMutation、useUpdateWorkMutation、usePublishWorkMutation、useCopyWorkMutation、useDeleteWorkMutation 和 useRestoreWorkMutation。',
      'editor store 新增 loadWorkContent 和 resetEditor，用于从服务端恢复作品或进入新建状态。',
      '编辑器保存时没有 workId 先创建作品并跳转 /editor/:uuid，有 workId 时执行 PATCH 保存。',
      '发布会先保存当前内容，再调用 publish 接口，确保 publishedContent 使用最新草稿。',
      'WorksPage 新增正常作品和已删除视图，删除后可以在已删除视图中恢复。',
    ],
    tests: [
      '创建作品返回 uuid，前端跳转到 /editor/:uuid。',
      '保存后详情接口可以看到最新 content。',
      '发布后 publishedContent 有值且 status=2。',
      '/works 能展示真实作品列表。',
      '点击编辑进入 /editor/:uuid 并恢复组件和页面设置。',
      '复制、删除、恢复操作成功后列表刷新。',
      'biz-editor-fe typecheck 和 build 通过。',
    ],
    nextStep:
      '补作品标题编辑、保存状态提示、接口错误态细化，并在接入登录后把 mock 用户替换为真实用户。',
  },
  {
    id: 'work-meta-save-status-plan',
    category: '实施计划',
    title: '作品元信息、保存状态与发布前校验计划',
    summary:
      '把作品标题、描述和封面作为 Work 元信息处理，保存和发布前统一校验并提交。',
    background:
      '作品标题不属于画布渲染内容，如果塞进 content 会污染 H5 渲染协议；但发布和作品列表又必须依赖标题，所以需要把它放在作品元信息层统一维护。',
    goals: [
      '编辑器可以修改作品标题、描述和封面 URL。',
      '默认的未命名作品只作为占位，保存和发布前必须改成明确标题。',
      '保存新作品和已有作品时都提交元信息和 content。',
      '发布前校验作品标题，标题缺失时先打开作品设置。',
      '工具栏展示未保存、保存中、已保存、发布中、发布成功和保存失败状态。',
      '接口错误文案能区分网络失败、参数错误、资源不存在和服务端错误。',
      '为后续登录态接入预留真实用户替换 mock 用户的边界。',
    ],
    decision:
      'title、desc、coverImg 作为 Work 顶层元信息；content 只保存 components、pageSetting 和后续页面 setting；publish 接口只负责发布快照和状态变更。',
    keyDesigns: [
      'EditorPage 内维护 workMeta，不放进 Zustand 画布状态。',
      'saveCurrentWork 统一组装 { title, desc, coverImg, content }。',
      '发布流程先保存当前草稿和元信息，再调用 publish。',
      '保存状态通过当前快照和最近一次保存快照比较得出。',
      '请求错误通过 src/api/error.ts 统一转换为用户可读文案。',
      '后续登录接入后，前端不传 author，后端从当前用户生成 author 和 user 字段。',
    ],
    implementation:
      '计划已落地。当前编辑器已支持作品设置弹窗、保存状态提示、发布前标题校验和统一接口错误文案。',
    implementationDetails: [
      '新增作品设置弹窗，字段包含标题、描述和封面图片 URL。',
      '新作品默认标题为未命名作品，已有作品从详情接口恢复元信息。',
      '保存新作品会创建后跳转 /editor/:uuid，保存已有作品会 PATCH 当前 uuid。',
      '发布前如果标题为空，会打开作品设置弹窗并阻止直接发布。',
      '保存前如果标题仍是未命名作品，也会打开作品设置并阻止直接保存。',
      '全局 Header 移除预览和保存按钮，编辑器内工具栏成为唯一保存和预览入口。',
      '作品列表加载失败时展示错误提示和重试按钮。',
      '统一 getRequestErrorMessage，按 HTTP status 映射错误文案。',
    ],
    tests: [
      '新建作品填写标题后保存，作品列表显示真实标题。',
      '编辑已有作品标题后保存，刷新详情仍能恢复标题。',
      '清空标题后发布会打开设置弹窗，不直接发布。',
      '发布成功后 status=2，并且 publishedContent 有当前内容快照。',
      '后端未启动时展示网络连接失败提示。',
      'biz-editor-fe typecheck 和 build 通过。',
      'biz-editor-server typecheck 和 build 通过。',
    ],
    nextStep:
      '接入 AuthModule 后移除 mock 用户，使用登录态用户生成作品 author 和 user 归属。',
  },
  {
    id: 'auth-module-work-ownership-plan',
    category: '实施计划',
    title: 'AuthModule 与作品归属接入计划',
    summary:
      '先做最小可用手机号登录和作品归属，把 Works API 从 mock-user 迁移到真实登录态用户。',
    background:
      'Works API 已经进入真实 MongoDB 数据阶段，如果继续使用 mock-user，后续作品列表、删除恢复、模板复用和管理后台都会缺少用户边界。',
    goals: [
      '新增 UsersModule，保存手机号用户基础信息。',
      '新增 AuthModule，支持发送 mock 验证码、手机号登录和获取当前用户。',
      '前端保存 token，并在请求层统一注入 Authorization。',
      '作品创建、列表、详情、保存、发布、复制、删除和恢复都基于当前用户归属。',
      '提供旧 mock 作品迁移命令，避免已有开发数据丢失可见性。',
    ],
    decision:
      '一期不接真实短信平台，也不做 RBAC；先用 mock 验证码和轻量 JWT 结构跑通登录闭环，WorksService 不再接受前端作者字段。',
    keyDesigns: [
      'User 模型保留 username、nickName、picture、phoneNumber、city、type、provider 和 oauthID。',
      'Auth token 使用 Bearer 方式传递，前端 request<T>() 统一注入。',
      'AuthGuard 校验 token 后向 request.user 写入 CurrentUser。',
      'WorksController 整体加 AuthGuard，所有作品操作都需要登录。',
      'WorksService 查询条件增加 user，默认只返回当前用户自己的作品。',
      'author 存用户昵称快照，user 存 MongoDB User ObjectId。',
    ],
    implementation:
      '计划已落地。当前已新增 UsersModule、AuthModule、AuthGuard、前端登录弹窗、token 注入和 Works 归属过滤。',
    implementationDetails: [
      '新增 /api/auth/send-code，开发环境返回 mockCode。',
      '新增 /api/auth/login-by-phone，验证码正确后自动创建手机号用户并返回 token。',
      '新增 /api/auth/me，返回当前登录用户。',
      'WorksService 创建和复制作品时使用当前用户写入 author 和 user。',
      'WorksService 列表和详情按当前用户过滤，未登录请求返回 401。',
      '新增 migrate:mock-user 命令，用默认开发手机号接管旧 mock-user 作品。',
      '前端 Header 新增登录入口、用户展示和退出登录。',
    ],
    tests: [
      '未登录访问作品接口返回 401，前端展示登录过期提示。',
      '手机号和 mock 验证码登录成功后，Header 展示当前用户。',
      '登录后创建作品，MongoDB 中 author 和 user 来源于当前用户。',
      '作品列表只展示当前用户自己的作品。',
      '执行 mock 迁移命令后，旧 mock-user 作品归属到默认开发用户。',
      'biz-editor-fe typecheck 和 build 通过。',
      'biz-editor-server typecheck 和 build 通过。',
    ],
    nextStep:
      '后续接真实短信服务，并在管理后台阶段扩展管理员角色、冻结用户和跨用户作品治理权限。',
  },
  {
    id: 'h5-nextjs-ssr-plan',
    category: '实施计划',
    title: 'H5 展示端 Next.js SSR 方案',
    summary:
      '使用 Next.js 初始化 h5-server，通过 /p/[uuid] 公开访问已发布作品，只渲染 publishedContent。',
    background:
      'B 端已经具备登录、创建、保存和发布能力，但发布后的作品还没有真实访问入口。H5 端需要优先保证首屏、分享和 URL 稳定，因此选择 SSR。',
    goals: [
      '初始化 apps/h5-server 为 Next.js + React 19 + TypeScript 应用。',
      '新增 /p/[uuid] H5 公开访问路由。',
      '新增 Nest 公开接口 /api/public/works/:uuid。',
      'H5 只读取 publishedContent，不读取草稿 content。',
      '已发布作品可访问，未发布、删除、强制下线或不存在作品展示不可访问页。',
      'B 端发布成功后提示稳定 H5 访问地址。',
    ],
    decision:
      'H5 使用 Next.js SSR，但继续通过 biz-editor-server 公开 API 获取作品数据，不直连 MongoDB，也不替代现有 Nest API 服务。',
    keyDesigns: [
      'Next.js App Router 使用 app/p/[uuid]/page.tsx 承载 H5 页面。',
      'H5 服务端组件通过 H5_API_BASE_URL 或默认 http://127.0.0.1:7001/api 拉取公开作品。',
      '公开接口只返回 uuid、title、desc、coverImg、publishedContent 和发布时间等展示字段。',
      'H5Renderer 根据 components 数组渲染组件，并用 left/top/width/height 绝对定位。',
      '页面背景、高度、背景图来自 publishedContent.props。',
      '业务组件库补齐 LText、LImage、LButton，供 H5 端复用。',
    ],
    implementation:
      '计划已落地。当前 h5-server 已初始化为 Next.js 应用，公开接口和基础 H5 渲染器已完成。',
    implementationDetails: [
      '新增 h5-server package、Next 配置、全局布局和样式。',
      '新增 /p/[uuid] 页面和 not-found 不可访问页。',
      '新增 getPublishedWork，服务端 fetch /api/public/works/:uuid。',
      '新增 H5Renderer，按作品 JSON 渲染文本、图片和按钮组件。',
      'biz-components 新增 LImage 和 LButton 并导出。',
      'B 端发布成功后提示 H5 URL。',
    ],
    tests: [
      '已发布作品访问 /p/:uuid 可看到页面。',
      '未发布、删除、强制下线或不存在作品访问 H5 显示不可访问。',
      '修改草稿但不发布，H5 仍展示旧 publishedContent。',
      '再次发布后，H5 展示最新发布快照。',
      '文本、图片、按钮的定位和尺寸与编辑器一致。',
      'h5-server typecheck 和 build 通过。',
      'biz-editor-server typecheck 和 build 通过。',
      'biz-components build 通过。',
    ],
    nextStep:
      '将编辑器画布也逐步切到业务组件库的 LImage 和 LButton，并补 H5 访问 URL 的复制/预览入口。',
  },
  {
    id: 'publish-settings-channel-stats-plan',
    category: '实施计划',
    title: '编辑器发布设置、渠道与统计一期方案',
    summary:
      '把预览、作品设置、手动保存、自动保存、发布、渠道链接和分渠道 PV 统计整合成一个完整发布工作流。',
    background:
      '编辑器已经具备创建、保存、发布和 H5 访问能力，但发布体验仍然分散：基本信息、预览、发布链接、渠道管理和统计没有形成运营闭环。对于营销作品来说，渠道链接必须稳定，重新发布不能丢失渠道，否则后续投放和统计无法追溯。',
    goals: [
      '点击“预览和设置”后，在画布上方显示实时 H5 手机预览，并在右侧打开设置抽屉。',
      '基本信息支持标题、描述、封面图，并能切换为分享卡片预览。',
      '手动保存和 5 秒防抖自动保存都写入服务端。',
      '关闭或刷新页面时，如果仍有未保存、保存中或保存失败状态，要触发浏览器离开提醒。',
      '发布为作品后展示发布结果、渠道二维码和渠道链接。',
      '发布为模板时保存模板标签和公开设置，模板链接不依赖渠道。',
      '作品支持默认渠道、新增渠道、删除渠道，并保证至少保留一个渠道。',
      'H5 访问时上报 PV，作品统计页展示总 PV 和分渠道 PV。',
    ],
    decision:
      '渠道属于作品级元信息，不放入 content；H5 只通过 URL 上的 channel 参数识别渠道；统计一期只做 page_view PV，不做 UV、设备、IP 去重和复杂图表。',
    keyDesigns: [
      'Work 新增 channels，每个渠道包含 id、name、createdAt，id 使用 uuid 并作为 URL 参数 channel 的值。',
      '创建作品时自动生成“默认”渠道，复制作品时重新生成默认渠道。',
      '重新发布只更新 publishedContent、status 和 latestPublishAt，不重建 channels，保证链接稳定。',
      '新增 WorkVisit 访问日志模型，字段包含 workUuid、eventName、channel、referer 和 userAgent。',
      '公开接口 POST /api/public/works/:uuid/visit 不需要登录，只接受已发布作品的访问上报。',
      'GET /api/works/:id/stats 需要登录和归属校验，返回 totalPv 和各渠道 PV。',
      '编辑器设置抽屉分为基本信息、发布为作品、发布为模板三块，降低发布操作的上下文切换。',
      '作品列表新增统计入口，进入 /works/:workId/stats 查看分渠道数据。',
    ],
    implementation:
      '计划已落地。当前已完成发布设置抽屉、分享预览、手动保存、自动保存、未保存离开提醒、渠道管理、发布结果弹层、H5 PV 上报和作品统计页。',
    implementationDetails: [
      'EditorPage 新增 PublishSettingsDrawer，承载基本信息、发布为作品、发布为模板和渠道管理。',
      '编辑基本信息时自动切换到分享预览，封面、标题和副标题实时反映到分享卡片。',
      'saveCurrentWork 支持 silent 模式，供自动保存和发布前保存复用。',
      '监听 saveStatus，当状态为 dirty、saving 或 error 时注册 beforeunload 提醒。',
      '新增 createWorkChannel、deleteWorkChannel、useWorkStatsQuery 等前端 API 和 React Query hooks。',
      '后端新增 createChannel、deleteChannel、getStats 和 recordVisit 服务方法，并校验渠道重名和最少保留一个渠道。',
      'H5 端新增 VisitReporter 客户端组件，读取 URL channel 参数并在页面挂载后上报 page_view。',
      'WorkStatsPage 使用总览卡片和表格展示作品名称、总 PV、渠道数、渠道链接和分渠道 PV。',
    ],
    tests: [
      'biz-editor-fe typecheck 和 build 通过。',
      'biz-editor-server typecheck 和 build 通过。',
      'h5-server typecheck 和 build 通过。',
      '本地 API 验证登录、创建作品、发布、创建渠道、H5 访问上报和统计查询。',
      '访问统计页 /works/:uuid/stats 能看到作品统计、默认渠道和 PV 数据。',
      '访问 H5 链接 /p/:uuid?channel=:channelId 后，默认渠道 PV 增加。',
      '统计接口返回纯净 channels 数据，不暴露 Mongoose 子文档内部字段。',
    ],
    nextStep:
      '继续增强发布体验：补真实封面上传、渠道复制反馈、二维码下载、统计图表和更细粒度的事件埋点。',
  },
  {
    id: 'server-qrcode-download-plan',
    category: '实施计划',
    title: '服务端生成渠道二维码下载方案',
    summary:
      '渠道二维码下载走服务端，由 NestJS 根据作品 uuid 和渠道 id 生成 PNG 附件，前端只负责触发下载。',
    background:
      '渠道二维码是投放物料的一部分，如果完全由前端生成，后续统一尺寸、颜色、Logo、水印、下载文件名和权限校验都会分散在 UI 中。放到服务端生成，可以让渠道链接和二维码规范集中维护。',
    goals: [
      '为每个渠道提供稳定的二维码 PNG 下载接口。',
      '二维码内容使用服务端 H5_BASE_URL 拼接，避免前端和后端链接规则不一致。',
      '下载接口沿用作品归属校验，只有作品拥有者可以下载渠道二维码。',
      '前端渠道行增加“下载二维码”动作，并保留复制链接。',
    ],
    decision:
      '使用服务端 qrcode 包生成 PNG Buffer，接口返回 image/png attachment；前端新增 requestBlob 处理二进制响应。',
    keyDesigns: [
      '新增 H5_BASE_URL 配置，默认 http://127.0.0.1:7002。',
      '新增 GET /api/works/:id/channels/:channelId/qrcode。',
      'WorksService 先通过当前用户查作品，再校验渠道是否存在。',
      '二维码尺寸固定 360px，容错级别使用 M，颜色跟随当前 B 端视觉层级。',
      '前端通过 blob URL 和 a.download 触发本地下载。',
    ],
    implementation:
      '计划已落地。当前渠道列表和发布成功弹层都支持下载服务端生成的二维码 PNG。',
    implementationDetails: [
      'biz-editor-server 引入 qrcode 和 @types/qrcode。',
      'configuration 增加 h5BaseUrl，并在 .env.example 中补 H5_BASE_URL。',
      'WorksController 新增二维码下载路由，并设置 Content-Type 与 Content-Disposition。',
      'src/api/http.ts 新增 requestBlob，用统一鉴权方式请求二进制文件。',
      'ChannelManager 增加“下载二维码”按钮，下载成功后给出提示。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      'curl 下载二维码接口返回 200、Content-Type=image/png、Content-Disposition=attachment。',
      '下载文件经 file 检查为 360 x 360 PNG。',
    ],
    nextStep:
      '后续可支持二维码带 Logo、渠道名水印、批量下载渠道二维码和二维码样式配置。',
  },
  {
    id: 'stats-page-enhancement-plan',
    category: '实施计划',
    title: '统计页图表化增强方案',
    summary:
      '在现有分渠道 PV 表格基础上，补近 7 天趋势、渠道排行和最高渠道，让统计页更接近运营人员可读的投放看板。',
    background:
      '渠道统计已经打通，但只有表格会显得像接口调试页。运营人员更关心总量、趋势、排行和渠道占比，因此需要在不引入图表库的前提下先做一个轻量看板。',
    goals: [
      '后端 stats 接口返回近 7 天 daily PV。',
      '后端 stats 接口返回 topChannels，方便前端直接展示排行。',
      '前端统计页展示总 PV、渠道数、最高渠道、近 7 天趋势和渠道占比。',
      '不引入新的图表库，先用 Ant Design 和 CSS 完成轻量图表。',
    ],
    decision:
      '统计一期继续保持轻量，后端只聚合 page_view，前端使用 CSS 柱状图和 Progress 排行；等统计需求稳定后再考虑 ECharts 或 Recharts。',
    keyDesigns: [
      'GET /api/works/:id/stats 增加 daily: { date, pv }[]。',
      'GET /api/works/:id/stats 增加 topChannels，按 PV 倒序取前 5。',
      'daily 固定返回 7 天，缺失日期补 0，避免前端补空洞。',
      '渠道排行按照当前渠道列表计算，占比用 channel.pv / totalPv。',
    ],
    implementation:
      '计划已落地。当前统计页已经展示近 7 天访问趋势、渠道排行、最高渠道和分渠道表格。',
    implementationDetails: [
      'WorksService.getStats 使用 Mongo aggregate 按 channel 聚合总 PV。',
      'WorksService.getStats 使用 $dateToString 按 Asia/Shanghai 聚合近 7 天 PV。',
      'WorkStats 类型新增 WorkStatsDailyItem、daily、topChannels。',
      'WorkStatsPage 新增趋势柱状图、渠道排行和最高渠道指标卡。',
      'CSS 新增 stats-insight-grid、stats-bar-chart 和 stats-ranking-list 等样式。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      '本地 stats 接口返回 dailyLength=7 和 topChannels。',
      '统计页在无数据时展示空状态，有数据时显示趋势和排行。',
    ],
    nextStep:
      '后续补日期范围筛选、UV/IP 去重、事件点击统计、趋势折线图和渠道转化率。',
  },
  {
    id: 'h5-component-interaction-stats-plan',
    category: '实施计划',
    title: 'H5 组件交互埋点与统计方案',
    summary:
      '在 H5 端打通组件点击埋点，把按钮、图片、文本等组件配置的 track 事件上报到访问日志，并在作品统计页展示交互总量和组件排行。',
    background:
      '分渠道 PV 只能回答“有多少人访问”，还不能回答“用户点了什么”。营销页通常需要跟踪按钮点击、图片入口和文本 CTA 等转化动作，因此需要把编辑器中的组件事件配置延伸到 H5 访问端和统计页。',
    goals: [
      'H5 渲染器识别组件 click 事件配置，并上报 track 类型事件。',
      'link 类型事件继续执行跳转，track 上报失败不阻断用户浏览和跳转。',
      '服务端只接受已发布快照中真实存在且配置过的组件事件，避免任意伪造事件污染统计。',
      '访问日志保存组件 id、组件类型、组件显示名、事件名和渠道。',
      '作品统计页展示组件点击总量、最热交互、Top 组件事件和明细表格。',
    ],
    decision:
      '组件埋点复用 WorkVisit 访问日志模型，不新建独立事件表；page_view 和组件事件通过 eventName 区分，统计接口按 eventName != page_view 聚合交互数据。',
    keyDesigns: [
      'H5Renderer 改为客户端组件，接收 workUuid 后在点击和键盘 Enter/Space 时触发组件事件。',
      'RecordVisitDto 增加 eventName、componentId、componentName、componentLabel、referer 和 userAgent。',
      'WorksService.recordVisit 读取 publishedContent 校验 componentId，并确认 eventName 命中该组件 click.track 配置。',
      'WorkVisit 增加组件字段，并建立 workUuid + eventName + componentId + createdAt 索引。',
      'GET /api/works/:id/stats 增加 totalComponentClicks、componentEvents 和 topComponentEvents。',
      'WorkStatsPage 新增组件点击量指标卡、最热交互、组件交互排行和事件明细表。',
    ],
    implementation:
      '计划已落地。当前 H5 页面可以上报组件 track 事件，服务端会按发布快照做白名单校验，B 端统计页可以查看组件交互数据。',
    implementationDetails: [
      'h5-server 新增共享 recordWorkVisit，VisitReporter 继续上报 page_view，H5Renderer 上报组件 track。',
      'H5Renderer 对有 click 事件的组件设置 button 语义、tabIndex 和 pointer cursor，支持点击与键盘触发。',
      'link 动作支持新窗口打开或当前窗口跳转，track 动作逐条异步上报。',
      'biz-editor-server 的 create/update DTO 改用共享 schema WorkContent 类型，减少 H5 和 B 端内容结构漂移。',
      'WorksService.getStats 同时聚合渠道 PV、近 7 天 PV 和组件交互事件。',
      'biz-editor-fe 的 WorkStats 类型和统计页 UI 已接入组件交互统计字段。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      'h5-server typecheck 和 build 通过。',
      'H5 Next build 通过，/p/[uuid] 保持动态服务端渲染。',
      '组件事件校验逻辑已限制非 page_view 必须命中 publishedContent 中配置的 click.track 事件。',
    ],
    nextStep:
      '后续可补真实端到端点击验证、事件转化率、按时间/渠道筛选组件事件，以及编辑器侧更明确的埋点配置入口。',
  },
  {
    id: 'editor-component-event-config-plan',
    category: '实施计划',
    title: '编辑器组件点击事件配置方案',
    summary:
      '把右侧属性面板中的事件功能升级为明确的点击埋点和点击跳转配置，让运营用户可以直接在编辑器里开启组件交互追踪。',
    background:
      'H5 端和统计页已经支持组件 track/link 事件，但如果编辑器侧只暴露裸 eventName 和 url 输入，用户很难理解哪些能力已启用，也无法配置新窗口打开。需要把事件配置做成可感知、可开启、可关闭的产品化面板。',
    goals: [
      '右侧属性面板的事件功能区拆分为“点击埋点”和“点击跳转”。',
      '点击埋点支持开关启用，启用时自动给出默认 eventName，并允许继续编辑。',
      '点击跳转支持开关启用，启用后填写 url，并配置是否新窗口打开。',
      '配置仍写入组件 events.click，保持与 H5Renderer 和服务端校验逻辑兼容。',
      '删除事件时清理对应 action，避免空配置污染作品 JSON。',
    ],
    decision:
      '继续沿用 ComponentEventAction 的 track/link 两类动作，不新增编辑器专用字段；编辑器 store 的 updateClickEvent 只扩展 openInNewTab 选项。',
    keyDesigns: [
      'SettingsPanel 在事件功能 Collapse 中渲染两张配置卡片，分别管理 track 和 link。',
      'track 开启时默认生成 text_click、image_click、button_click 形式的事件名。',
      'link 开启时默认填入 https:// 占位值，避免开关开启后没有可编辑 action。',
      'openInNewTab 存入 link action，H5 端已按该字段选择 window.open 或当前窗口跳转。',
      '事件配置卡片在右侧窄栏中使用轻量边框和渐变背景，降低和普通属性项的混淆。',
    ],
    implementation:
      '计划已落地。当前选中组件后，可以在“事件功能”中开启点击埋点、点击跳转，并配置跳转是否新窗口打开。',
    implementationDetails: [
      'EditorPage 的 SettingsPanel 新增组件事件配置卡片 UI。',
      'editorStore.updateClickEvent 增加 options.openInNewTab，并写入 link action。',
      '新增 getDefaultTrackEventName，根据组件名生成默认点击事件名。',
      'App.css 新增 component-event-config、component-event-card 和 component-event-inline-option 样式。',
    ],
    tests: [
      'biz-editor-fe typecheck 通过。',
      'biz-editor-fe build 通过。',
      '生产构建仅保留既有 Vite 大 chunk 警告，不影响产物生成。',
    ],
    nextStep:
      '下一步建议做真实端到端验证：配置按钮事件、发布作品、访问 H5 点击按钮，再回统计页确认组件点击量和排行增长。',
  },
  {
    id: 'product-navigation-phase-one-plan',
    category: '实施计划',
    title: '全应用产品导航与页面结构重构方案',
    summary:
      '把开发期的“编辑器/作品/模板”入口重构为真实产品路径：首页模板市场、我的作品、我的模板、回收站和消息中心。',
    background:
      '随着作品、模板、发布和统计功能逐步打通，原来的导航更像研发调试入口，不符合运营用户的日常路径。用户进入产品后通常先找模板或管理自己的作品，而不是直接进入编辑器。',
    goals: [
      '根路由 / 进入公开模板市场，未登录用户也能浏览公开模板。',
      '我的作品改为卡片式管理，支持搜索、分页、新建空白作品、使用模板创建、编辑、统计、复制、删除和转赠入口。',
      '我的模板独立成页，展示自己发布或接收的模板。',
      '回收站展示已删除项目，并支持恢复。',
      '消息中心承载系统消息和作品转赠消息入口。',
      '开发记录从主导航移到右侧辅助入口，避免干扰业务主链路。',
    ],
    decision:
      '第一期先完成产品信息架构和主要页面骨架；真实收藏、转赠和消息接口后续分期接入。公开模板市场补最小后端接口，避免首页依赖登录态。',
    keyDesigns: [
      '顶部主导航调整为：首页、我的作品、我的模板、回收站、消息中心。',
      '编辑器不再作为常驻主菜单，而是通过新建空白作品、使用模板创建、编辑作品进入。',
      '公开模板使用 GET /api/public/works/templates 查询，只返回已发布、公开、标记为模板的作品。',
      '使用模板创建使用 POST /api/works/templates/:id/use，后端复制公开模板为当前用户的未发布作品。',
      '作品列表和模板列表统一使用卡片式布局，二维码通过 hover Popover 展示。',
      '回收站保留表格，因为恢复操作更偏管理场景，表格扫描效率更高。',
    ],
    implementation:
      '计划已落地第一期。当前已完成导航重排、公开模板首页、我的作品卡片页、我的模板页、回收站和消息中心。',
    implementationDetails: [
      '新增 HomePage，支持公开模板搜索、tag 筛选、收藏入口和使用模板创建。',
      '重写 WorksPage 为卡片式我的作品，支持搜索、分页、编辑、统计、复制、删除和转赠占位。',
      '新增 MyTemplatesPage，展示自己的模板卡片和二维码入口。',
      '新增 RecycleBinPage，接入已删除作品列表和恢复接口。',
      '新增 MessagesPage，提供系统消息、转赠消息和已读交互占位。',
      'WorksService 新增 findPublicTemplates 和 usePublicTemplate。',
      'PublicWorksController 新增公开模板列表接口，WorksController 新增使用公开模板创建接口。',
      'ListWorksDto 和前端 ListWorksParams 增加 keyword/templateTag，用于搜索和 tag 筛选。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      '本地后端启动后确认 /api/public/works/templates 路由已注册。',
      '浏览器验证 /、/works、/my-templates、/recycle-bin、/messages 均正常渲染。',
      '作品页能展示当前用户作品卡片，回收站能展示已删除项目和恢复按钮。',
    ],
    nextStep:
      '第二期进入模板详情和使用模板体验：补 /templates/:id、收藏模板、模板浏览量、模板使用量和更完整的公开模板详情接口。',
  },
  {
    id: 'template-detail-phase-two-plan',
    category: '实施计划',
    title: '模板详情与使用模板创建二期方案',
    summary:
      '在公开模板市场基础上补模板详情页，点击模板卡片进入详情，支持收藏和使用模板创建新作品。',
    background:
      '首页模板市场只能完成浏览和快速使用，但用户通常需要先查看模板详情、作者、标签、二维码预览和使用次数，再决定是否复用。模板详情也是后续收藏、分享、浏览统计和模板推荐的承载页。',
    goals: [
      '公开模板卡片点击进入 /templates/:id。',
      '模板详情展示缩略图、标题、副标题、作者、标签、二维码、浏览量占位和使用量。',
      '点击“使用模板”复制公开模板为当前用户的新作品，并进入编辑器。',
      '收藏按钮先实现本地状态，后续可替换为服务端收藏接口。',
      '模板详情页不强制登录，只有使用模板时需要登录。',
    ],
    decision:
      '二期继续保持小步闭环：后端新增公开模板详情接口，前端新增详情页和本地收藏 hook；收藏和浏览量真实数据后续单独接入。',
    keyDesigns: [
      '新增 GET /api/public/works/templates/:id，限定 isTemplate=true、isPublic=true、status=2。',
      '模板详情页使用公开接口，不依赖登录态。',
      '使用模板仍走 POST /api/works/templates/:id/use，由服务端复制模板为当前用户作品。',
      '收藏状态使用 localStorage 保存模板 uuid 列表，避免提前设计收藏表。',
      '模板二维码使用 H5 公开地址 /p/:uuid，方便快速预览发布效果。',
    ],
    implementation:
      '计划已落地。当前公开模板卡片可进入详情页，详情页可收藏并使用模板创建作品。',
    implementationDetails: [
      'WorksService 新增 findPublicTemplateByIdentity，返回详情页所需字段。',
      'PublicWorksController 新增 /api/public/works/templates/:id。',
      '前端 works API 新增 getPublicTemplate 和 usePublicTemplateQuery。',
      '新增 useFavoriteTemplates hook，使用 localStorage 维护收藏模板列表。',
      '新增 TemplateDetailPage，展示模板详情、二维码、作者、标签、浏览量占位、使用次数和操作按钮。',
      'HomePage 的模板卡片点击进入详情，收藏按钮切换本地收藏态。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      '模板首页卡片点击可进入 /templates/:id。',
      '未登录访问模板详情不跳登录，点击使用模板时跳登录。',
      '登录后使用模板创建新作品并进入 /editor/:uuid。',
    ],
    nextStep:
      '第三期继续补作品操作增强：转赠接口、转赠消息、收藏服务端持久化、模板浏览量真实统计和模板详情页预览增强。',
  },
  {
    id: 'template-market-sort-preview-plan',
    category: '实施计划',
    title: '模板市场排序与预览入口增强方案',
    summary:
      '在已有关键词和标签筛选基础上，补公开模板排序能力和更明确的预览详情入口，让用户更快找到值得复用的模板。',
    background:
      '模板市场已经能搜索、按标签筛选、收藏和使用模板，但列表默认只按发布时间排序，卡片点击进入详情也不够显性。用户浏览模板时通常会按最新、热门、使用最多切换，并希望先预览详情再决定是否创建作品。',
    goals: [
      '公开模板接口支持 latest、hot、copied 三种排序。',
      '首页模板市场增加排序选择器，切换后重新请求服务端结果。',
      '模板卡片增加“预览详情”按钮，和“使用模板”形成明确的浏览/创建分工。',
      '保留卡片整体点击进入详情，收藏和使用按钮继续阻止冒泡。',
      '移动端下筛选标签和排序控件上下排列，避免工具栏拥挤。',
    ],
    decision:
      '排序放在服务端完成，避免分页后只对当前页排序导致结果不稳定；前端只维护 sort 查询参数并复用现有公开模板 queryKey。',
    keyDesigns: [
      'ListWorksDto 增加 sort，可选 latest、hot、copied。',
      'WorksService.findPublicTemplates 根据 sort 生成 Mongo sort 条件。',
      'latest 按 latestPublishAt、updatedAt 倒序。',
      'hot 先按 isHot 倒序，再按发布时间倒序。',
      'copied 先按 copiedCount 倒序，再按发布时间倒序。',
      'HomePage 增加 templateSort 状态，并传给 usePublicTemplatesQuery。',
      '模板卡片底部增加次级“预览详情”按钮，主按钮继续用于使用模板。',
    ],
    implementation:
      '计划已落地。当前首页模板市场支持最新发布、热门推荐、使用最多排序，并在卡片中显式展示预览详情入口。',
    implementationDetails: [
      'biz-editor-server 的 ListWorksDto 增加 sort 字段校验。',
      'WorksService 新增 getPublicTemplateSort，统一公开模板排序规则。',
      'biz-editor-fe 的 ListWorksParams 增加 sort 参数。',
      'HomePage 增加 templateSortOptions、Select 排序控件和卡片预览按钮。',
      'App.css 增加 market-template-toolbar、market-template-sort 和 product-template-preview-button 样式。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      '生产构建仅保留既有 Vite 大 chunk 警告，不影响产物生成。',
    ],
    nextStep:
      '后续可做模板使用确认弹层、模板详情页真实 H5 预览、服务端收藏持久化和模板浏览量统计。',
  },
  {
    id: 'template-use-confirm-live-preview-plan',
    category: '实施计划',
    title: '模板使用确认与真实 H5 预览方案',
    summary:
      '在模板市场和详情页统一使用模板确认弹层，并把模板详情页左侧升级为手机壳内嵌 H5 真实预览，降低误创建作品的成本。',
    background:
      '模板市场已经支持排序、预览详情和一键使用，但“使用模板”会直接创建作品，属于偏重动作，用户误点后会产生无效作品。详情页虽然有二维码，但仍缺少不用扫码即可查看发布效果的真实预览。',
    goals: [
      '首页模板卡片点击“使用模板”后先展示确认弹层。',
      '模板详情页点击“使用模板”复用同一确认弹层。',
      '确认弹层展示模板封面、标题、描述、作者、标签和使用次数。',
      '确认后再调用现有 usePublicTemplate mutation 创建作品。',
      '模板详情页左侧使用手机壳 iframe 内嵌 /p/:uuid，展示真实 H5 发布快照。',
      '详情页保留新窗口打开 H5 预览入口。',
    ],
    decision:
      '确认弹层只放在前端，不新增后端接口；真实预览直接复用已发布 H5 URL，避免维护第二套模板预览渲染逻辑。',
    keyDesigns: [
      '新增 UseTemplateConfirmModal 共享组件，HomePage 和 TemplateDetailPage 共同使用。',
      'HomePage 的 handleUseTemplate 拆为请求确认和确认创建两步。',
      'TemplateDetailPage 的使用模板流程同样拆为请求确认和确认创建。',
      '确认弹层在未登录场景前仍保持原逻辑：先跳登录，不弹创建确认。',
      '模板详情页使用 iframe 加载 VITE_H5_BASE_URL/p/:uuid，并提供新窗口打开按钮。',
      '手机壳预览和确认弹层都补移动端响应式布局。',
    ],
    implementation:
      '计划已落地。当前首页和详情页使用模板前都会确认，详情页可直接在手机壳中查看真实 H5 预览。',
    implementationDetails: [
      '新增 components/UseTemplateConfirmModal.tsx。',
      'HomePage 增加 confirmTemplate 状态，并在确认后创建作品。',
      'TemplateDetailPage 增加 confirmTemplate 状态和 handleOpenPreview。',
      'TemplateDetailPage 左侧预览从静态封面替换为 template-detail-live-preview iframe 手机壳。',
      'App.css 增加 use-template-confirm、template-preview-phone 和 template-preview-caption 等样式。',
    ],
    tests: [
      'biz-editor-fe typecheck 通过。',
      'biz-editor-fe build 通过。',
      '生产构建仅保留既有 Vite 大 chunk 警告，不影响产物生成。',
    ],
    nextStep:
      '后续可继续做服务端收藏持久化、模板浏览量真实统计、详情页相关推荐和使用模板后的来源追踪。',
  },
  {
    id: 'work-transfer-messages-phase-three-plan',
    category: '实施计划',
    title: '作品转赠与消息中心真实化三期方案',
    summary:
      '把作品/模板卡片中的转赠入口做成真实功能，并将消息中心从静态占位升级为服务端消息列表。',
    background:
      '作品转赠是员工离职交接、跨运营人员协作时非常关键的管理能力。没有归属转移，作品列表只能服务个人创作，无法覆盖真实团队交接场景。',
    goals: [
      '作品和模板卡片右上角菜单中的“转赠”打开真实弹窗。',
      '支持按手机号、用户名、昵称搜索目标用户。',
      '转赠成功后作品从当前用户列表移除，目标用户获得管理权限。',
      '转赠成功后给目标用户创建消息。',
      '消息中心展示真实消息列表，支持单条已读和全部已读。',
    ],
    decision:
      '一期转赠采用直接转移归属，不做“对方接受”流程；消息模块独立建表，避免把通知类数据塞进用户或作品模型。',
    keyDesigns: [
      '新增 GET /api/users/search?keyword=xxx，排除当前用户。',
      '新增 POST /api/works/:id/transfer，body 为 targetUserId。',
      '后端 transfer 校验作品归属、目标用户存在、不能转赠给自己。',
      '转赠只更新 work.user，author 暂时保留原作者快照。',
      '新增 MessagesModule 和 messages 集合，字段包含 user/type/title/content/isRead/workUuid/fromUser。',
      '转赠成功后创建 transfer 类型消息，目标用户登录后可见。',
    ],
    implementation:
      '计划已落地。当前作品和模板均支持真实转赠，消息中心已接入真实消息接口。',
    implementationDetails: [
      'UsersService 新增 search，UsersController 新增 /api/users/search。',
      'MessagesModule 新增 Message schema、MessagesService 和 MessagesController。',
      'WorksService 新增 transfer，并注入 UsersService 与 MessagesService。',
      'WorksController 新增 /api/works/:id/transfer。',
      '前端新增 users.ts、messages.ts 和 transferWork mutation。',
      '新增 TransferWorkModal，支持搜索用户、选择用户和确认转赠。',
      'WorksPage 与 MyTemplatesPage 接入转赠弹窗。',
      'MessagesPage 改为真实接口数据，支持 mark read 和 read all。',
    ],
    tests: [
      'biz-editor-server typecheck 和 build 通过。',
      'biz-editor-fe typecheck 和 build 通过。',
      '用户搜索接口可返回目标用户，且排除当前用户。',
      '转赠接口执行后作品归属变更，当前用户列表不再包含该作品。',
      '转赠成功后目标用户消息中心可看到转赠消息。',
    ],
    nextStep:
      '后续补收藏服务端持久化、转赠操作审计、可选的转赠接受流程，以及消息跳转到对应作品详情。',
  },
  {
    id: 'message-center-close-loop-phase-four-a-plan',
    category: '实施计划',
    title: '消息中心闭环优化四期 A 方案',
    summary:
      '在真实消息接口基础上补齐消息筛选、点击已读和转赠消息查看作品入口，让转赠后的通知体验形成闭环。',
    background:
      '第三期已经完成了作品转赠和真实消息列表，但消息中心仍偏列表展示：用户收到转赠消息后还需要自己去作品列表寻找对应作品，未读消息也缺少自然的处理路径。',
    goals: [
      '消息中心支持全部、未读、转赠、系统筛选。',
      '点击消息项时自动标记为已读。',
      '转赠消息提供“查看作品”按钮，直接进入 /editor/:workUuid。',
      '消息摘要区域展示全部消息和转赠消息数量。',
      '顶部导航未读 Badge 和消息中心未读数保持同步。',
    ],
    decision:
      '先在前端完成交互闭环，不新增后端接口。消息类型和 workUuid 已经在 Message 模型中存在，足够支撑当前查看作品入口。',
    keyDesigns: [
      'MessagesPage 本地维护 MessageFilter 状态，使用已有消息数据做前端筛选。',
      'markReadSilently 封装点击已读逻辑，避免用户点击消息时弹出多余提示。',
      '转赠消息的查看作品按钮先标记已读，再跳转编辑器。',
      '列表项保留“标为已读”按钮，满足精确操作；点击整项则是轻量快捷操作。',
      '未读消息使用浅色背景强调，但不破坏列表扫描效率。',
    ],
    implementation:
      '计划已落地。消息中心现在支持筛选、点击已读和从转赠消息进入作品编辑器。',
    implementationDetails: [
      'MessagesPage 新增 filter 状态、filteredMessages 和 transferCount。',
      '新增 Segmented 筛选器：全部、未读、转赠、系统。',
      '新增 openTransferWork，标记已读后 navigate 到 /editor/:workUuid。',
      '消息列表项新增 is-unread 样式和点击已读交互。',
      'App.css 新增 message-list-toolbar、message-summary-stats、message-list-item 等样式。',
    ],
    tests: [
      'biz-editor-fe typecheck 通过。',
      'biz-editor-fe build 通过。',
      '消息中心在无消息和筛选为空时均显示明确空状态。',
      '转赠消息渲染“查看作品”按钮，点击后进入对应作品编辑页。',
    ],
    nextStep:
      '下一步继续做回收站体验增强：类型筛选、恢复确认、恢复后的去向提示，以及后续的彻底删除能力。',
  },
  {
    id: 'docker-compose-deployment-plan',
    category: '实施计划',
    title: 'Docker Compose 一期部署方案',
    summary:
      '为 B 端、Nest API、H5 SSR 和 MongoDB 增加 Docker Compose 部署脚手架，让项目可以在云主机或本地模拟生产环境中整体启动。',
    background:
      '项目已经包含 B 端编辑器、H5 展示端、NestJS 服务和 MongoDB。继续只依赖本地 dev 命令会让环境启动、交付和线上验证越来越不稳定，因此需要先把部署骨架搭起来。',
    goals: [
      '提供一条命令构建生产镜像。',
      '提供一条命令启动完整生产拓扑。',
      'B 端静态资源使用 Nginx 托管。',
      'H5 端使用 Next.js standalone 产物运行。',
      'Nest API 使用生产 Node 镜像运行。',
      'MongoDB 使用 Docker volume 持久化。',
      '文档说明端口、环境变量、域名和后续 HTTPS/CI 边界。',
    ],
    decision:
      '一期选择 Docker Compose，而不是直接绑定某个云平台。这样可以先固化服务边界，后续迁移到云主机、镜像仓库、Kubernetes 或 PaaS 都更顺。',
    keyDesigns: [
      '新增 docker-compose.prod.yml，包含 mongo、biz-editor-server、h5-server、biz-editor-fe 四个服务。',
      'API 服务运行时使用 MONGODB_URI=mongodb://mongo:27017/ai_editor 访问 Compose 内部 Mongo。',
      'B 端 Vite 的 VITE_API_BASE_URL 和 VITE_H5_BASE_URL 作为 build args 写入静态产物。',
      'H5 的服务端请求使用 H5_API_BASE_URL 指向 Compose 内部 API，客户端 PV 上报使用 NEXT_PUBLIC_H5_API_BASE_URL。',
      'Next.js 开启 output: standalone，减少 H5 运行镜像复杂度。',
      'Nginx 配置增加 SPA fallback，保证 React Router 刷新不 404。',
    ],
    implementation:
      '计划已落地。一期已经新增 Dockerfile、Compose 配置、部署环境变量模板、Nginx 配置和部署文档。',
    implementationDetails: [
      '新增 deploy/dockerfiles/biz-editor-server.Dockerfile。',
      '新增 deploy/dockerfiles/biz-editor-fe.Dockerfile。',
      '新增 deploy/dockerfiles/h5-server.Dockerfile。',
      '新增 deploy/nginx/biz-editor-fe.conf。',
      '新增 docker-compose.prod.yml。',
      '新增 .env.deploy.example 和 docs/deployment.md。',
      '根 package.json 新增 deploy:build、deploy:up、deploy:down、deploy:logs。',
    ],
    tests: [
      'docker compose --env-file .env.deploy.example -f docker-compose.prod.yml config 通过。',
      'biz-editor-server build 通过。',
      'biz-editor-fe build 通过。',
      'h5-server build 通过。',
      'Docker 镜像构建已启动，但当前 Docker 镜像源拉取 node:22-alpine 时 EOF 中断，需要切换可用镜像源后重试。',
    ],
    nextStep:
      '下一步配置真实域名、HTTPS 反向代理和 GitHub Actions 自动构建/发布；如果走云主机，可以先用 Caddy 或 Nginx 托管 80/443。',
  },
  {
    id: 'admin-server-development-plan',
    category: '实施计划',
    title: 'admin-server 管理后台 API 开发计划',
    summary:
      '在现有 NestJS 管理服务骨架上补齐后台治理能力，优先覆盖管理员鉴权、作品治理、用户治理、模板治理和审计记录。',
    background:
      'B 端编辑器、H5 展示和作品发布链路已经形成基础闭环，但平台还缺少运营和管理员视角的治理能力。admin-server 需要独立承载高权限接口，避免把强制下线、用户冻结、模板上下架等能力混入普通业务 API。',
    goals: [
      '复用当前 MongoDB 数据模型和登录 token，限制只有管理员角色可以访问后台接口。',
      '先完成作品治理：列表检索、状态筛选、强制下线、恢复发布和基础详情。',
      '补齐用户治理：用户列表、角色查看、冻结/解冻和关联作品统计。',
      '补齐模板治理：公开模板列表、模板上下架、推荐位和异常模板处理。',
      '增加治理操作审计，记录管理员、操作类型、目标资源、原因和时间。',
      '为后续 admin-fe 提供稳定的接口边界和 DTO 约定。',
    ],
    decision:
      'admin-server 作为独立 NestJS 服务演进，不直接复用 biz-editor-server 的 Controller；只在 schema、鉴权 token 和数据库层面保持兼容，保证普通用户接口和后台高权限接口边界清晰。',
    keyDesigns: [
      '保留 /admin 前缀，所有后台治理接口统一挂载 AdminAuthGuard。',
      'AdminAuthGuard 解析 Bearer token 后读取用户角色，仅允许 UserRole.Admin 访问。',
      '作品治理先使用 Work 的 status、isTemplate、isPublic、user、latestPublishAt 等字段形成后台列表。',
      '强制下线不删除作品数据，而是把作品状态切换为 ForceOffline，方便恢复和追溯。',
      '用户冻结需要新增用户状态字段或冻结标记，并在普通业务 AuthGuard 中同步拦截。',
      '审计记录建议新增 AdminAuditLog schema，避免治理动作只存在于接口日志中。',
      'admin-fe 后续只消费 admin-server，不直接调用 biz-editor-server 的用户态接口。',
    ],
    implementation:
      '作品治理、审计查询与用户治理阶段已落地。当前 admin-server 已具备 NestJS 启动骨架、MongoDB 连接、health 接口、管理员鉴权守卫、作品治理、用户列表、用户详情、冻结/解冻、治理审计写入和审计日志查询能力。',
    implementationDetails: [
      '已补齐 AdminWorksModule 第一阶段能力：作品详情、下线原因、恢复原因、操作审计和 Work 后台治理字段。',
      '新增 admin_audit_logs 集合，记录治理动作、目标资源、管理员、原因和状态变更快照。',
      '新增 AdminAuditModule，提供审计日志分页查询和单条详情查询。',
      'AdminWorksModule 改为依赖 AdminAuditService 写审计，避免作品模块直接持有审计 collection。',
      '审计列表支持 action、targetType、targetUuid、keyword、page、pageSize 查询参数。',
      '强制下线时写入 adminOfflineReason、adminOfflineBy、adminOfflineAt，并把作品状态切换为 ForceOffline。',
      '恢复发布时把作品状态切回 Published，并写入恢复发布审计记录。',
      '新增 AdminUsersModule，提供用户列表、用户详情、按角色/状态筛选、冻结和解冻接口。',
      '用户 schema 新增 status、frozenReason、frozenAt 字段，admin-server 与 biz-editor-server 保持一致。',
      '冻结/解冻用户会写入 admin_audit_logs，targetType=user，记录操作者、原因和状态变更快照。',
      'biz-editor-server 登录和 token 校验会拦截 Frozen 用户，旧 token 也会因为数据库状态变化而失效。',
      'AdminAuthGuard 同步拦截被冻结的管理员账号访问后台。',
      '第三阶段：新增 AdminTemplatesModule，提供模板审核、上下架、推荐标记和模板来源追踪。',
      'AdminTemplatesModule 已落地，基于 works collection 中 isTemplate=true 的数据提供模板列表、详情、上架、下架、推荐和取消推荐接口。',
      '模板上架定义为 isPublic=true 且要求 status=Published；模板下架会同步取消 isHot，避免前台推荐不可见模板。',
      'AdminAuditModule 已扩展模板治理动作：template.publish、template.unpublish、template.recommend、template.cancel_recommend。',
      '第五阶段：补充 OpenAPI 或 API 文档数据，供 admin-fe 页面开发直接对齐字段。',
      '第六阶段：接入部署配置，确保 docker-compose.prod.yml 中 admin-server 的环境变量、端口和健康检查可用。',
    ],
    tests: [
      'admin-server typecheck 通过。',
      'admin-server build 通过。',
      'biz-editor-server typecheck 通过。',
      'biz-editor-server 侧已同步 Work 后台治理字段，避免同 collection schema 长期不一致。',
      'biz-editor-server 侧已同步 User 冻结字段，并在 AuthService 中拦截 Frozen 用户。',
      '管理员账号 13800138000 已完成本地联调，admin-server 可通过 admin token 访问治理接口。',
      '作品治理列表已去掉 coverImg 大字段，避免列表接口返回 base64 图片导致页面长时间 loading。',
      '用户治理列表已兼容历史用户缺少 role/status 的数据，默认按 user/active 输出。',
      'GET /api/admin/works、/api/admin/users、/api/admin/audit-logs 本地联调通过。',
      'pnpm 依赖链接已恢复，admin-server typecheck 和 build 通过。',
      '模板治理接口联调通过：列表、推荐、取消推荐、下架、恢复上架均可正常更新 works 字段。',
      '模板治理审计联调通过：template.publish、template.unpublish、template.recommend、template.cancel_recommend 均可查到审计记录。',
      '后台权限回归通过：未携带 token 访问 /admin/templates 返回 401。',
      '后台权限回归通过：普通用户 token 访问 /admin/templates 返回 403。',
      '后台权限回归通过：admin token 访问 /admin/templates 返回 200。',
      '待联调：发布作品可强制下线，ForceOffline 作品可恢复发布。',
      '待联调：冻结用户后普通业务接口不能继续执行写操作。',
      '待联调：每次治理动作都可通过审计查询接口检索。',
    ],
    nextStep:
      '下一步把 admin 部署编排和开发记录拆分提交，再继续做作品下线、用户冻结的操作级联调。',
  },
  {
    id: 'admin-fe-initialization-plan',
    category: '实施计划',
    title: 'admin-fe 管理后台首版初始化计划',
    summary:
      '初始化独立 admin-fe 应用，先对接现有 admin-server 的作品治理、用户治理和审计日志接口，避免继续扩大后端范围。',
    background:
      'admin-server 已经具备作品下线/恢复、用户冻结/解冻和审计日志查询能力。继续扩展模板治理前，应该先做一个可用的管理前端，把已有后台治理闭环跑通并暴露真实交互问题。',
    goals: [
      '在 apps/admin-fe 下初始化独立 Vite + React + TypeScript 应用。',
      '复用 biz-editor-server 登录接口获取 token，使用 admin-server 校验管理员权限。',
      '提供作品治理、用户治理和审计日志三类页面。',
      '将 admin-fe 纳入 pnpm workspace、根脚本和 Turborepo 构建链路。',
      '保持首版简单可用，不接模板治理、不做复杂权限菜单。',
    ],
    decision:
      'admin-fe 作为独立应用实现，不嵌入 biz-editor-fe 路由；首版使用两个 API Base URL：认证走 biz-editor-server，治理走 admin-server。',
    keyDesigns: [
      'VITE_AUTH_API_BASE_URL 指向 biz-editor-server，用于 /auth/send-code、/auth/login-by-phone、/auth/me。',
      'VITE_ADMIN_API_BASE_URL 指向 admin-server，用于 /admin/works、/admin/users、/admin/audit-logs。',
      'admin-fe 使用独立 localStorage token key，避免和 B 端普通用户登录态互相污染。',
      'ProtectedAdminRoute 在前端检查 token 和 role=admin，admin-server 的 AdminAuthGuard 继续作为最终权限边界。',
      '左侧导航只保留作品治理、用户治理、审计日志，避免空菜单和未实现入口。',
    ],
    implementation:
      '计划已落地。当前 apps/admin-fe 已初始化并完成三类治理页面、登录页、API 请求层、React Query 缓存和基础后台布局。',
    implementationDetails: [
      '新增 admin-fe package、Vite 配置、TypeScript 配置、ESLint 配置和入口 HTML。',
      '新增 authStorage、http、auth、adminWorks、adminUsers、adminAudit 和 error API 模块。',
      '新增 LoginPage，复用手机号验证码登录，并拒绝非 admin 用户进入后台。',
      '新增 WorksPage，支持作品筛选、分页、详情、强制下线和恢复发布。',
      '新增 TemplatesPage，支持模板筛选、分页、详情、上架、下架、推荐和取消推荐。',
      '新增 UsersPage，支持用户筛选、分页、详情、冻结和解冻。',
      '新增 AuditLogsPage，支持审计日志筛选、分页和详情快照查看。',
      '新增 adminTemplates API 模块，并把模板治理入口加入左侧导航。',
      '审计日志筛选和展示已支持 template 目标类型及四类模板治理动作。',
      '根 package.json 新增 dev:admin-fe，并把 admin-fe 加入 dev:apps。',
      'biz-editor-fe 首页新增“管理后台”入口按钮，默认跳转到 http://127.0.0.1:7004/login。',
      'biz-editor-fe 新增 /admin/* 外部跳转路由，便于从 http://localhost:5173/admin 进入 admin-fe。',
      'biz-editor-fe 跳转 admin-fe 时会携带当前登录 token，admin-fe 登录页接收 token 后自动校验管理员权限并进入后台。',
      '新增 admin-fe 生产 Dockerfile 和 Nginx SPA 配置，静态产物独立部署在管理后台站点。',
      'docker-compose.prod.yml 新增 admin-fe 服务，依赖 biz-editor-server 和 admin-server 健康检查后启动。',
      'biz-editor-fe 生产构建写入 VITE_ADMIN_FE_BASE_URL，部署后 /admin 会跳转到真实管理后台地址。',
      '.env.deploy.example 新增 ADMIN_FE_PUBLIC_BASE_URL、ADMIN_API_PUBLIC_BASE_URL 和 ADMIN_FE_PORT。',
    ],
    tests: [
      'pnpm install 通过，workspace 已识别 admin-fe。',
      'admin-fe typecheck 通过。',
      'admin-fe build 通过。',
      'admin-fe lint 通过。',
      'biz-editor-fe typecheck 通过。',
      'biz-editor-fe build 通过。',
      'admin-fe 共享 token 免登链路 typecheck/build 通过。',
      'Vite build 提示首包超过 500k，原因是 Ant Design 后台首版未拆包，暂不影响可用性。',
      '本地真实登录链路已通过：5173 登录后进入 /admin 会携带 token 跳转到 7004，并由 admin-fe 自动校验管理员权限。',
      '作品治理、用户治理和审计日志三个列表接口已完成真实 admin token 联调。',
      'admin-fe 部署配置已接入 Docker Compose 和部署文档。',
      '真实作品下线、用户冻结和审计日志落库仍需继续做操作级联调。',
      'docker compose config 已通过，admin-fe、admin-server、biz-editor-fe、h5-server 和 mongo 服务编排可正确解析。',
      'admin-fe 和 biz-editor-fe 镜像构建已启动，但当前 Docker 镜像源拉取 node:22-alpine/nginx:1.27-alpine 时 EOF 中断，需要切换可用镜像源后重试。',
      'pnpm 依赖链接已恢复，admin-fe typecheck 和 build 通过。',
      'admin-fe /admin/templates 和 /login SPA 入口均返回 200，模板治理页面已接入路由。',
      '后台权限回归通过：无 token、普通用户 token、admin token 在模板治理接口分别返回 401、403、200。',
    ],
    nextStep:
      '下一步把 admin 部署编排和开发记录拆分提交，再继续做作品下线、用户冻结的操作级联调。',
  },
]
