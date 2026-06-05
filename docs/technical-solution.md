# H5 营销作品搭建平台技术方案

## 1. 项目定位

本项目是一个 H5 营销作品搭建平台，核心目标是让用户在 B 端创建、编辑、保存、发布 H5 作品，并让访客通过 C 端 H5 页面访问作品。管理后台负责平台治理，统计系统负责形成业务闭环。

一期目标不是完整平台化，而是跑通核心链路：

```txt
登录 -> 我的作品 -> 创建作品 -> 编辑作品 -> 保存作品 -> 发布作品 -> H5 SSR 访问 -> 后台下线/屏蔽 -> 基础统计
```

## 2. 核心业务模块

### B 端和编辑器

B 端面向普通用户和运营人员，负责作品生产。

一期包含：

- 登录和用户信息
- 我的作品
- 创建作品
- 编辑作品
- 保存作品
- 发布作品
- 模板列表
- 使用模板创建作品

编辑器采用左中右结构：

```txt
左侧：组件模板库
中间：画布
右侧：属性设置面板
```

### H5 展示端

H5 展示端面向访客，负责消费已发布作品。

一期包含：

- 根据作品 ID 获取作品 JSON
- 判断作品状态
- SSR 渲染页面
- 展示不可访问页
- 基础 PV 上报

### 管理后台

管理后台面向管理员，负责平台治理。

一期包含：

- 作品管理
- 下线/恢复作品
- 用户管理
- 冻结/解冻用户
- 模板管理
- 基础数据统计

### 统计系统

统计系统是业务闭环的一部分。一期先做轻量统计，后续再扩展为完整自研统计服务。

一期包含：

- H5 PV 上报
- workId 统计
- visitorId 统计
- channel 预留

后续扩展：

- 渠道统计
- 分享统计
- 组件点击统计
- 表单提交统计
- OpenAPI
- 日志分析
- 数据可视化

## 3. 技术选型

### 前端

- Vite
- React 19
- TypeScript
- Ant Design 6
- Zustand + Immer
- TanStack Query

### H5 SSR

- Node.js
- React SSR
- Vite SSR
- 复用 `renderer-core` 和 `biz-components`

### 服务端

- Node.js
- NestJS 或 Fastify，实施时再最终确定
- PostgreSQL
- Prisma
- Redis 后置

### 工程化

- pnpm workspace
- Turborepo
- ESLint
- Prettier
- Vitest
- GitHub Actions

全仓约定：

- 所有 app 和 package 都使用 TypeScript。
- 每个子项目初始化时都继承根目录 `tsconfig.base.json`。
- 默认开启严格类型检查，避免在核心协议、组件 props、接口类型中留下隐式风险。

## 4. Monorepo 结构

```txt
apps/
  biz-editor-fe/        # B 端前端，作品管理 + 编辑器
  biz-editor-server/    # B 端 API 服务
  h5-server/            # H5 SSR 服务
  admin-fe/             # 管理后台前端
  admin-server/         # 管理后台 API 服务

packages/
  editor-schema/        # 作品 JSON 协议、组件类型、枚举
  biz-components/       # 业务组件库，如 LText、LImage、LShape
  renderer-core/        # JSON -> React 渲染器
  shared/               # 通用类型、常量、工具
  tracking-sdk/         # 前端埋点 SDK

docs/
  technical-solution.md

tsconfig.base.json       # 全仓 TypeScript 基础配置
```

原则：

- 工程上使用 monorepo 管理。
- 应用可以独立开发、独立构建、独立部署。
- 公共协议、组件、渲染器沉淀到 `packages/`。
- 具体 app 和 package 做到哪里再初始化到哪里。

## 5. 作品数据结构

作品内容以 JSON 协议为唯一数据源。

```ts
export interface Work {
  schemaVersion: string
  title: string
  setting: Record<string, unknown>
  props: Record<string, unknown>
  components: ComponentData[]
}

export interface ComponentData {
  id: string
  name: string
  props: Record<string, unknown>
}
```

说明：

- `schemaVersion` 用于后续协议升级和历史作品迁移。
- `title` 是作品标题。
- `setting` 存储作品级配置，如分享、统计等。
- `props` 存储页面级配置，如背景色、页面宽度等。
- `components` 是有序数组，用于画布和 H5 渲染。
- `currentElement`、`activeComponentId` 只属于编辑器状态，不进入作品发布数据。

## 6. 作品流转

一期采用最简单清晰的数据流。

```txt
创建作品：初始化 JSON，保存到 works.content，status = draft
保存作品：修改 works.content
发布作品：修改 status = published
H5 浏览：获取 JSON，判断 status，SSR 渲染
屏蔽作品：修改 status = offline，H5 展示不可访问页
```

作品状态：

```ts
export type WorkStatus = 'draft' | 'published' | 'offline' | 'deleted'
```

后续可升级为发布快照：

```txt
content             草稿内容
published_content   已发布内容
```

或者独立版本表：

```txt
work_versions
```

## 7. 业务组件库方案

业务组件库位于：

```txt
packages/biz-components
```

职责：

- 提供业务组件，如文本、图片、图形、按钮等。
- 同时服务 B 端编辑器画布和 H5 SSR。
- 只负责展示和基础行为。
- 不依赖编辑器状态。
- 不依赖 H5 服务。
- 不依赖业务 API。

组件属性采用平铺方案：

```tsx
<LText
  text="你好"
  color="#333"
  fontSize="16px"
/>
```

不优先采用：

```tsx
<LText
  css={{ color: '#333', fontSize: '16px' }}
  text="你好"
/>
```

原因：

- 保存数据更简单。
- 更新属性更简单。
- 属性面板更容易根据 schema 自动渲染。
- 不需要在更新时判断字段属于样式还是业务属性。

组件通过注册机制接入：

```ts
export interface ComponentMeta {
  name: string
  component: React.ComponentType<any>
  defaultProps: Record<string, unknown>
  propSchema: PropSchema[]
}
```

新增组件流程：

```txt
实现组件 -> 定义 defaultProps -> 定义 propSchema -> 注册到 registry -> 补测试
```

## 8. Renderer 方案

渲染器位于：

```txt
packages/renderer-core
```

职责：

- 接收作品 JSON。
- 根据组件 `name` 从组件 registry 中找到组件。
- 渲染成 React 组件树。
- 支持不同运行模式。

运行模式：

```ts
export type RenderMode = 'edit' | 'preview' | 'runtime'
```

不同模式的区别：

- `edit`：编辑器画布，点击组件是选中。
- `preview`：预览模式，接近真实 H5，但仍在 B 端。
- `runtime`：线上 H5，真实跳转、分享、埋点。

## 9. 编辑器方案

编辑器核心是组件数组状态。

```ts
export interface EditorStore {
  work: Work
  currentElement: string | null
}
```

状态管理：

- Zustand 管编辑器本地状态。
- Immer 简化深层数据更新。
- TanStack Query 管作品详情、保存、发布等服务端状态。
- Ant Design Form 管右侧属性面板的表单状态。

### 左侧组件模板库

左侧展示预设组件模板。

点击模板时：

```txt
生成 uuid -> 合并 defaultProps -> addComponent -> 写入 store.work.components
```

左侧模板用 `TemplateWrapper` 包裹，避免模板点击、拖拽等行为污染业务组件。

### 中间画布

画布根据 `work.components` 循环渲染。

组件外层使用 `CanvasWrapper`：

- 选中
- hover
- 拖拽
- 缩放
- 删除
- 右键菜单

这些交互能力不放进业务组件内部。

### 右侧属性面板

右侧属性面板不写死表单，而是使用组件的 `propSchema` 自动渲染。

```ts
export interface PropSchema {
  field: string
  label: string
  component: string
  options?: unknown[]
}
```

示例：

```ts
const textPropSchema = [
  { field: 'text', label: '文本', component: 'Input' },
  { field: 'color', label: '颜色', component: 'ColorPicker' },
  { field: 'fontSize', label: '字号', component: 'InputNumber' }
]
```

右侧表单变化和画布交互变化统一走：

```ts
updateComponent(id, propKey, newValue)
```

## 10. 编辑器交互插件化

以下能力不直接耦合到业务组件：

- 快捷键
- 右键菜单
- 拖拽移动
- 拖拽缩放
- 复制粘贴
- 撤销/重做
- 画布缩放

这些能力通过 hooks 或 plugin 方式逐步接入：

```txt
useHotKey
useDragMove
useResize
useContextMenu
useCopyPaste
useHistory
useZoom
```

它们的共同模式是：

```txt
监听交互 -> 计算结果 -> 调用 store action
```

## 11. H5 SSR 方案

H5 展示端位于：

```txt
apps/h5-server
```

职责：

- 接收 `/p/:workId` 访问。
- 查询作品数据。
- 判断作品状态。
- 使用 `renderer-core` 和 `biz-components` SSR 渲染。
- 注入分享 meta。
- 上报基础访问统计。

访问规则：

```txt
published -> SSR 渲染作品
draft/offline/deleted -> 展示不可访问页
```

H5 不依赖编辑器状态，只消费作品 JSON。

## 12. 后台管理方案

后台管理由两个应用组成：

```txt
apps/admin-fe
apps/admin-server
```

一期能力：

- 管理员登录
- 全局作品列表
- 作品下线
- 作品恢复
- 用户列表
- 用户冻结
- 用户解冻
- 模板列表
- 模板上下架
- 基础统计面板

治理原则：

- 下线作品只修改状态，不物理删除。
- 冻结用户后是否同步下线作品，作为策略配置预留。
- 所有高风险操作后续写入操作日志。

## 13. 数据库初版

一期先围绕核心链路建模。

```txt
users
- id
- phone
- nickname
- avatar
- status
- created_at
- updated_at

works
- id
- owner_id
- title
- content
- status
- is_template
- created_at
- updated_at
- published_at
- offline_at
- offline_reason
- deleted_at

templates
- id
- title
- description
- cover_img
- content
- status
- sort
- created_at
- updated_at

tracking_events
- id
- work_id
- visitor_id
- channel
- event_type
- created_at
```

后续扩展：

```txt
work_versions
work_channels
work_transfers
work_daily_stats
channel_daily_stats
operation_logs
admin_users
roles
permissions
```

## 14. 一期开发顺序

建议按以下顺序开发：

```txt
1. 搭建 monorepo 基础工程
2. 初始化 editor-schema
3. 初始化 biz-components，实现 LText / LImage / LShape
4. 初始化 renderer-core
5. 初始化 biz-editor-fe，实现编辑器最小闭环
6. 初始化 biz-editor-server，实现作品创建/保存/发布
7. 初始化 h5-server，实现 SSR 渲染作品
8. 初始化 admin-fe/admin-server，实现基础治理
9. 初始化 tracking-sdk，实现基础 PV 上报
```

每个模块做到时再初始化具体源码和依赖，避免一开始生成大量空工程。

所有模块初始化时都必须使用 TypeScript 模板或 TypeScript 配置，不再创建 JavaScript-only 工程。
