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
