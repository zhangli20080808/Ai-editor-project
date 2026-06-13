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
]
