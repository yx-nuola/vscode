# CLAUDE.md This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要交互规则

当你被问到修改请求时，**先给出方案，不要直接改源代码逻辑和文件**。等用户确认方案后再实施。

## 项目概述

VSCode 插件 + Electron 图形化工作台。插件在 VSCode 中提供数据面板（Webview），同时可启动独立 Electron 窗口展示图形化工作台，支持多卡片拖拽布局和 ICE 服务数据渲染。Webview 侧包含 RRAM 测试结果的二维矩阵图（Bitmap）可视化组件。

## 构建命令

```bash
# VSCode 插件（esbuild 打包 extension.ts → dist/extension.js）
npm run compile          # 类型检查 + lint + esbuild
npm run watch            # 并行监听 esbuild 和 tsc
npm run package          # 生产构建（压缩，无 sourcemap）

# 类型检查 & lint
npm run check-types      # tsc --noEmit
npm run lint              # eslint src

# Webview（Vite 打包 → dist-webview/）
npm run build:webview
npm run dev:webview       # --watch 模式

# Electron 主进程（tsc → dist-electron/main/）
npm run build:electron

# Electron 渲染进程（Vite 打包 → dist-electron/renderer/）
npm run build:electron:renderer

# Electron 全量构建
npm run build:electron:all    # 主进程 + 渲染进程

# Electron 开发模式
npm run dev:electron          # 并行监听主进程和渲染进程
npm run start:electron:dev    # 构建主进程 + 启动渲染开发服务器 + electron
npm run start:electron:prod   # 全量构建 + electron .

# 测试
npm run test                  # VSCode 扩展测试（@vscode/test-cli）
npm run compile-tests         # 编译测试到 out/
```

## 架构

项目包含三个独立运行的进程，通过 IPC 通信：

```
VSCode Extension (Ext)  ─── stdio IPC ───>  Electron Main  ─── ipcMain/ipcRenderer ───>  Electron Renderer
     │                                            │                                          │
  ICE服务调用                                   窗口管理                                  React + 图形渲染
  数据分块(2KB/块)                             消息路由转发                              react-grid-layout
  背压控制                                     CSP 策略                                  ECharts / Canvas
  状态栏                                       布局存储                                  CardDataManager
```

### VSCode 插件侧 (`src/ext/`)

- **入口**: `extension.ts` → 注册所有命令和 Webview Provider
- **electron/launcher.ts**: `ElectronLauncher` 类，通过 `child_process.spawn` 启动 Electron 进程，管理 stdio IPC 通信、背压控制、卡片数据加载
- **electron/iceService.ts**: `IceService` 类，ICE 服务 HTTP 调用封装，含重试机制(3次)和 AbortController 取消支持
- **electron/dataProcessor.ts**: `DataProcessor` 类，将卡片数据分块(2KB/块)为 ArrayBuffer，按 50ms 间隔发送
- **providers/DataPanelProvider.ts**: VSCode Webview View Provider，加载 `dist-webview/` 到 VSCode 侧边栏面板
- **server/DataServer.ts**: 简单数据获取服务(含 mock 数据)
- **register/**: 命令注册
- **types/**: `EXTENSION_ID`, `Commands`, `DataItem`, `VSCodeMessage` 类型定义

### Electron 主进程 (`src/electron/main/`)

- **index.ts**: `ElectronMain` 类，创建 BrowserWindow(1200x800)，配置 CSP、contextIsolation、preload 脚本
- **preload/index.ts**: 通过 `contextBridge` 暴露 `window.electronAPI`（sendToMain, onRendererMessage, loadLayout, saveLayout）
- **types/ipc.ts**: 三层 IPC 消息类型定义 — `ExtToMain`, `MainToRenderer`, `RendererToMain`，以及 `DataChunk`, `CardConfig`, `LayoutData`, `CardType`

### Electron 渲染进程 (`src/electron/renderer/`)

- **App.tsx**: 接收 `DATA_CHUNK` 消息，通过 `CardDataManager` 解析后更新卡片数据
- **hooks/useWorkbench.ts**: 管理卡片配置、布局状态、可见卡片集合，布局持久化(防抖 500ms)
- **components/WorkbenchLayout.tsx**: react-grid-layout 集成(12列, rowHeight=80)
- **components/Card.tsx**: 三种渲染器 — EChartsRenderer(动态 import echarts)、LogicFlowRenderer、CanvasRenderer(2D Canvas 采样绘制)
- **utils/CardDataManager.ts**: 数据块缓存 + LRU 缓存(lru-cache) + Web Worker 线程内解析二进制数据

### VSCode Webview (`src/webview/`)

独立 React 应用，Vite 构建，运行在 VSCode 侧边栏 Webview 中：

- **components/DataTable/**: 数据表格组件
- **components/bitmap/**: RRAM 二维矩阵图可视化（当前版本使用 Konva 的 `TimingRenderer`）
  - `renderer/index.ts`: 核心渲染类，基于 Konva.Stage，分层管理(layerFloor/layer/layerCosine/layerCover)，内置缩放/滚动条/标记/波形等工具
  - 包含大型测试数据文件: `test-data-128x1024.json`, `test-data-64x64.json`
- **components/bitmap-bak/**: 旧版 Bitmap 组件备份（KonvaGridBase 体系，含 AbstractKonvaGrid, interfaces, parsers, renderers）
- **components/virtuoso/**: 虚拟滚动列表实验性组件（多个优化迭代版本）
- **hooks/useVSCode.ts**: vscode-messenger-webview 通信 hook

## 关键技术细节

- **三套独立的 TypeScript 配置**: 根 `tsconfig.json`(Ext)、`src/electron/tsconfig.json`(主进程)、`src/webview/tsconfig.json` 和 `src/electron/renderer/tsconfig.json`(渲染进程)
- **三套独立构建**: esbuild(Ext)、tsc(Electron 主进程)、Vite(渲染进程 + Webview)
- **IPC 数据流**: ICE 服务数据 → DataProcessor 分块 → stdio IPC → Electron Main 路由 → ipcMain → 渲染进程 CardDataManager 组装解析
- **CardType**: `'echarts' | 'logicflow' | 'canvas'` — 贯穿整个数据流
- **中文注释**: 源码中广泛使用中文注释

## 代码风格

- TypeScript strict mode，ES2022 target，Node16 modules(Ext) / CommonJS(Electron 主进程)
- ESLint: typescript-eslint，规则包括 `curly: warn`, `eqeqeq: warn`, `semi: warn`, `no-throw-literal: warn`
- Electron 主进程代码使用 `@ts-nocheck`（index.ts, preload/index.ts）
- CardDataManager.ts 也使用 `@ts-nocheck`

## 测试

- VSCode 扩展测试: `@vscode/test-cli` + `@vscode/test-electron`，测试文件 `src/test/extension.test.ts`
- Webview 单元测试: vitest + jsdom（配置在 `src/webview/vitest.config.mts`）
- 测试输出到 `out/test/` 目录

## openspec

`openspec/` 目录包含变更管理规范（proposal → design → specs → tasks），当前有三个活跃 change:
- `bitmap-component-refactor`: Bitmap 组件重构（cell 事件回调、cell 尺寸配置、数据模式配置、矩阵网格组件、滚动条配置）
- `bitmap-visualization`: Bitmap 可视化（渲染器、单元格弹窗、颜色映射、文件解析器、表格-图形联动）
- `fix-log-memory-leak`: 日志内存泄漏修复（批处理、内存管理、渲染优化）
