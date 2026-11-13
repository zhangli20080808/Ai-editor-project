export interface TechnicalPlan {
  id: string
  title: string
  summary: string
  scope: string
  architecture: string[]
  dataModel: string[]
  flow: string[]
  tradeoffs: string[]
  verification: string[]
  next: string[]
}

export const technicalPlans: TechnicalPlan[] = [
  {
    id: 'monorepo-fullstack',
    title: '大型全栈 Monorepo 架构方案',
    summary:
      '用 apps 承载端应用，用 packages 承载可复用能力，保证 B 端、H5、服务端和组件库能独立演进。',
    scope:
      '覆盖 biz-editor-fe、biz-editor-server、h5-server、biz-components，以及后续 admin-fe/admin-server、统计服务和公共 schema 包。',
    architecture: [
      'apps/biz-editor-fe：B 端编辑器和工作台，负责作品生产、模板使用、发布设置和统计查看。',
      'apps/biz-editor-server：NestJS API 服务，负责认证、作品、模板、渠道、统计和公开 H5 数据接口。',
      'apps/h5-server：Next.js SSR 服务，负责公开访问已发布作品。',
      'packages/biz-components：业务展示组件库，逐步成为编辑器画布和 H5 渲染的共同依赖。',
      '后续 packages/editor-schema 可以承载作品 JSON 协议，避免多端重复定义类型。',
    ],
    dataModel: [
      '作品内容使用 WorkContent = { components, props: pageSetting, setting? }。',
      '组件使用 ComponentData 表达 id、name、props、events、layerName、isHidden、isLocked。',
      'Work 顶层保存 title、desc、coverImg、status、isTemplate、channels、templateTags 等元信息。',
      'publishedContent 与 content 分离，保存草稿不影响线上 H5。',
    ],
    flow: [
      'B 端创建或保存作品，服务端写入 MongoDB。',
      '发布时服务端把 content 快照到 publishedContent。',
      'H5 端通过公开 API 获取 publishedContent 并 SSR 渲染。',
      'H5 客户端上报 PV，B 端统计页读取分渠道统计。',
    ],
    tradeoffs: [
      'Monorepo 增加了初期脚手架复杂度，但降低多项目类型漂移和重复发布成本。',
      'H5 不直连 MongoDB，牺牲一点调用链路长度，换取业务查询逻辑集中在 API 层。',
      '组件库分阶段替换，避免过早抽象阻塞编辑器交互迭代。',
    ],
    verification: [
      'pnpm workspace 可以单独执行各 app 的 typecheck/build。',
      'dev:local 一次启动 Mongo、B 端、API、H5。',
      '发布作品后 H5 可以通过 /p/:uuid 访问。',
    ],
    next: [
      '沉淀 editor-schema 包。',
      '把本地 LImage/LButton 逐步迁移到业务组件库。',
      '新增 admin-fe/admin-server 时复用现有 API 类型和鉴权边界。',
    ],
  },
  {
    id: 'editor-state-history',
    title: '编辑器状态与操作日志方案',
    summary:
      '编辑器本地状态由 Zustand 管理，撤销重做不保存全量快照，而是保存操作日志和 patch。',
    scope: '覆盖组件增删改、拖动、缩放、图层排序、页面设置和快捷键操作。',
    architecture: [
      'Zustand store 管理 components、currentElement、pageSetting、historyPast、historyFuture。',
      'CanvasElement 作为业务组件 Wrapper，承载选中、拖动、缩放、删除等编辑器交互。',
      '右侧设置面板通过 schema 修改组件 props，不直接操作 DOM。',
      '快捷键层调用 store action，避免和 UI 组件耦合。',
    ],
    dataModel: [
      'HistoryRecord 包含 id、type、label、timestamp、patches。',
      'HistoryPatch 描述新增、删除、字段更新、页面设置更新、图层顺序更新等变更。',
      '拖动一次记录 left/top 两个字段，缩放一次记录 left/top/width/height 四个字段。',
      '快速输入同一字段通过 mergeKey 合并历史记录，保留第一次 oldValue 和最后一次 newValue。',
    ],
    flow: [
      '用户操作触发 store action。',
      'action 更新当前状态，同时记录 HistoryRecord。',
      'undo 从 historyPast 弹出一条记录，按 oldValue 逆向应用。',
      'redo 从 historyFuture 取出一条记录，按 newValue 正向重放。',
    ],
    tradeoffs: [
      '操作日志比全量快照实现复杂，但历史记录更可读，存储量更小。',
      '拖动过程实时更新状态，交互流畅；结束时只提交一条历史，避免历史栈爆炸。',
      '历史记录暂不持久化到后端，降低一期复杂度。',
    ],
    verification: [
      '新增、删除、修改、拖动、缩放都能撤销重做。',
      '从历史中间继续编辑会清空 redo 栈。',
      '历史最大长度限制为 50。',
      'Popover 可以观察历史栈变化。',
    ],
    next: [
      '增加历史记录分组展示。',
      '支持多选后的批量移动和批量撤销。',
      '把历史系统抽成 editor-history 模块。',
    ],
  },
  {
    id: 'publish-channel-stats',
    title: '发布设置、渠道和统计方案',
    summary:
      '发布不只是改状态，还要形成“预览设置 -> 保存 -> 发布 -> 渠道投放 -> 统计反馈”的运营闭环。',
    scope:
      '覆盖发布设置抽屉、作品基本信息、发布为作品、发布为模板、渠道管理、二维码下载和分渠道 PV。',
    architecture: [
      'EditorPage 内聚合发布设置抽屉和实时 H5 预览。',
      'Works API 负责作品、渠道和统计数据。',
      'Public Works API 给 H5 SSR 提供已发布作品数据。',
      'H5 VisitReporter 负责页面挂载后的 PV 上报。',
    ],
    dataModel: [
      'Work.channels = { id, name, createdAt }[]，id 作为 URL channel 参数。',
      'WorkVisit 保存 workUuid、eventName、channel、referer、userAgent。',
      'templateTags 和 isPublic 保存在 Work 顶层，模板不使用渠道。',
      'H5_BASE_URL 在服务端配置，二维码和渠道链接都基于它生成。',
    ],
    flow: [
      '打开“预览和设置”，右侧编辑基本信息，中间显示页面或分享预览。',
      '手动保存或 5 秒自动保存把元信息和 content 写入服务端。',
      '发布作品前先保存草稿，再生成 publishedContent。',
      '发布成功后展示渠道二维码、渠道链接和新增渠道入口。',
      '访问 /p/:uuid?channel=:channelId 后 H5 上报 page_view。',
      '统计页按 workUuid 聚合总 PV 和 channel PV。',
    ],
    tradeoffs: [
      '渠道放在 Work 顶层，不污染 content，避免 H5 渲染协议承担运营投放概念。',
      '二维码走服务端生成，前端轻量，但服务端多一个图片生成依赖。',
      '一期统计只做 PV，先保证闭环，UV 和去重后续再做。',
    ],
    verification: [
      '发布后 H5 可访问且 URL 稳定。',
      '新增渠道名称不能重复，删除时至少保留一个渠道。',
      '二维码下载接口返回 360 x 360 PNG。',
      '访问 H5 后统计页 PV 增加。',
    ],
    next: [
      '补二维码 Logo、水印和批量下载。',
      '统计页增加趋势图和渠道占比。',
      '新增点击事件埋点和 OpenAPI。',
    ],
  },
  {
    id: 'auth-work-ownership',
    title: 'AuthModule 与作品归属方案',
    summary:
      '用最小可用登录态替换 mock-user，让作品创建、查询、保存和发布都收口到当前用户。',
    scope: '覆盖 UsersModule、AuthModule、前端登录态、API token 注入和 WorksService 归属过滤。',
    architecture: [
      'UsersModule 管理手机号用户和 AuthUser 转换。',
      'AuthModule 提供 send-code、login-by-phone、me。',
      'AuthGuard 验证 Bearer token 并写入 currentUser。',
      '前端 request<T>() 统一注入 Authorization。',
    ],
    dataModel: [
      'User 保存 username、nickName、picture、phoneNumber、city、type、provider、oauthID。',
      'Work.author 保存展示名快照。',
      'Work.user 保存真实 User ObjectId。',
      'AuthUser 至少包含 id、username、nickName、phoneNumber。',
    ],
    flow: [
      '用户输入手机号和验证码登录。',
      '服务端校验 mock code，自动创建或更新用户。',
      '前端保存 token，刷新后调用 /auth/me 恢复用户。',
      'WorksController 受 AuthGuard 保护，所有查询都按 currentUser.user 过滤。',
    ],
    tradeoffs: [
      '一期 mock 短信降低外部依赖，适合先建立作品归属边界。',
      '暂不做 RBAC，管理员能力留到 admin 阶段。',
      '旧 mock 数据通过迁移脚本归属到默认开发用户。',
    ],
    verification: [
      '未登录访问作品接口返回 401。',
      '登录后 Header 展示当前用户。',
      '创建作品 MongoDB 中 user 为当前用户 ObjectId。',
      '当前用户只能看到自己的作品。',
    ],
    next: [
      '接真实短信服务。',
      '增加登录过期刷新策略。',
      '后台管理阶段补管理员角色和权限。',
    ],
  },
  {
    id: 'h5-next-ssr-renderer',
    title: 'H5 Next.js SSR 渲染方案',
    summary:
      'H5 端使用 Next.js SSR，公开访问只读取 publishedContent，保证性能、分享和草稿隔离。',
    scope: '覆盖 h5-server、公开作品接口、H5Renderer 和 PV 上报。',
    architecture: [
      'Next.js App Router 提供 /p/[uuid] 动态 SSR 页面。',
      'getPublishedWork 在服务端调用 Nest 公开 API。',
      'H5Renderer 根据 WorkContent 渲染页面背景和绝对定位组件。',
      'VisitReporter 是客户端组件，只负责 PV 上报。',
    ],
    dataModel: [
      'PublishedWork 只包含 H5 需要的 uuid、title、desc、coverImg、channels、publishedContent。',
      'publishedContent.props 表示页面设置。',
      'publishedContent.components 表示组件列表和样式 props。',
      'URL query channel 不进入渲染数据，只用于统计。',
    ],
    flow: [
      '用户访问 /p/:uuid。',
      'Next 服务端请求 /api/public/works/:uuid。',
      '服务端只允许 status=2 且存在 publishedContent 的作品返回。',
      'Next 渲染 H5 页面，客户端挂载后上报 PV。',
    ],
    tradeoffs: [
      'SSR 首屏更适合分享和营销落地页。',
      'H5 不直连 MongoDB，避免两端维护重复查询逻辑。',
      '客户端上报 PV 可能被浏览器限制，但不影响页面访问。',
    ],
    verification: [
      '已发布作品访问 H5 成功。',
      '未发布、删除、强制下线作品展示不可访问。',
      '修改草稿不发布，H5 仍展示旧快照。',
      'h5-server typecheck/build 通过。',
    ],
    next: [
      '补微信分享 meta 信息。',
      '补组件库统一渲染。',
      '支持页面动画和事件跳转。',
    ],
  },
]
