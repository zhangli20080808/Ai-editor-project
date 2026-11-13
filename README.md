# Lego Platform

H5 marketing work creation platform.

This repository uses a monorepo layout. Apps and packages are initialized only when their implementation starts.

All apps and packages use TypeScript by default and should extend the root `tsconfig.base.json`.

## Structure

```txt
apps/
  biz-editor-fe/
  biz-editor-server/
  h5-server/
  admin-fe/
  admin-server/

packages/
  editor-schema/
  biz-components/
  renderer-core/
  shared/
  tracking-sdk/

docs/
  technical-solution.md
tsconfig.base.json
```

## First Phase

The first phase focuses on the core closed loop:

```txt
login -> create work -> edit work -> save work -> publish work -> SSR H5 access -> offline governance -> basic stats
```

## Demo Flow

本地启动后访问 `http://localhost:5173`，使用手机号 `13800138000` 和本地验证码 `123456` 登录。

推荐按以下顺序演示核心能力：

1. 从首页选择公开模板，创建作品并在编辑器中修改组件。
2. 保存并发布作品，打开 `http://127.0.0.1:7002/p/:uuid` 验证 SSR H5 页面。
3. 在编辑器点击“AI 生成”，输入品牌宣传、商品种草或活动报名需求。
4. 观察模型流式策划、受控工具调用和草稿校验，使用自然语言继续修改草稿。
5. 选择“创建为新作品”，手动保存并发布，确认原作品未被覆盖。
6. 从 AI 创作记录恢复历史版本，再进入作品统计或管理后台演示完整治理链路。

AI 模型需要在 `apps/biz-editor-server/.env` 配置 `LLM_API_BASE_URL`、`LLM_API_KEY` 和 `LLM_MODEL`。部署与 Docker 编排说明见 `docs/deployment-details.md`。
