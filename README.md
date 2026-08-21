# RRAM 数据可视化 VS Code 插件

基于 Webview 的 VS Code 扩展，提供数据面板、RRAM Bitmap 矩阵图、折线图等可视化能力。

## 功能

- **数据面板**：侧边栏 Webview 数据表格
- **RRAM Bitmap 编辑器**：128×1024 矩阵可视化（Konva + 虚拟滚动）
- **折线图 / 文件树**：Webview 内多路由页面

## 命令速查

| 场景 | 命令 |
|------|------|
| 本地开发（热更新） | `npm run dev` 或 **F5** |
| 一次性构建（F5 调试前） | `npm run build` |
| 打包 VSIX 插件 | `npm run package:vsix` |
| 打包并安装到本机 VS Code | `npm run package:vsix:install` |
| 全量校验（JSON + 格式 + 类型 + ESLint） | `npm run validate` |
| 自动格式化源码 | `npm run format` |

## 保存时自动校验与格式化

项目已配置 `.vscode/settings.json`，**Ctrl+S 保存时**会自动：

1. **Prettier** — 格式化缩进、引号、分号等样式
2. **ESLint** — 自动修复可修复项；无法修复的显示为波浪线报错
3. **TypeScript** — 类型错误实时显示（内置语言服务）

首次打开项目时，请安装推荐扩展（VS Code 右下角会提示）：

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 按 F5 启动（会自动开启 watch：扩展 + Webview 热更新）
# 或手动运行：npm run dev
```

首次调试也可先执行一次完整构建：

```bash
npm run build
```

然后按 **F5** 运行扩展。

### 开发时可用命令

- `打开数据面板` — 聚焦底部 Panel Webview
- `Open RRAM Bitmap Editor` — 打开 Bitmap 编辑器

## 打包插件（VSIX）

```bash
# 构建扩展主进程 + Webview，并生成 .vsix
npm run package:vsix
```

产物：`my-extension-0.0.1.vsix`

安装方式：

```bash
code --install-extension my-extension-0.0.1.vsix
```

或 VS Code → Extensions → `...` → Install from VSIX

## 项目结构

```
src/
├── extension.ts          # 扩展入口
├── ext/                  # 扩展主进程（Provider、Messenger、命令）
├── webview/              # Webview UI（Vite + React）→ dist-webview/
└── shared/               # 扩展与 Webview 共享类型
dist/
└── extension.js          # esbuild 打包产物（扩展主进程）
dist-webview/             # Vite 打包产物（Webview 静态资源）
```

## 技术栈

- VS Code Extension API
- React 19 + Vite 7
- Konva / ECharts / VTable
- vscode-messenger（Extension ↔ Webview 通信）