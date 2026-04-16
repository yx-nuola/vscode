# VSCode + Electron 图形化工作台

一款 VSCode 插件，通过 Electron 窗口展示图形化工作台，支持多卡片拖拽布局、ICE 服务数据渲染。

## 功能特性

- **Electron 独立窗口**: 从 VSCode 触发独立的 Electron 窗口
- **拖拽布局**: 使用 react-grid-layout 实现多卡片拖拽、大小调整
- **图形渲染**: 支持 ECharts 图表、LogicFlow 流程图、Canvas 自定义图形
- **高效通信**: 三层 IPC 架构 + 流式分块传输 + 背压控制
- **性能优化**: 骨架屏、LRU 缓存、Web Worker 数据解析

## 启动命令

- `打开 Electron 工作台`: 启动 Electron 图形化工作台窗口
- `关闭 Electron 工作台`: 关闭已打开的 Electron 窗口

## 技术栈

- VSCode Extension API
- Electron 18+
- React 18+
- react-grid-layout
- ECharts / LogicFlow

## 开发

```bash
# 编译 Electron 主进程
npm run build:electron

# 启动 Electron 进行测试
npm run start:electron

# 打包 VSCode 插件
npm run package
```

## 架构

```
VSCode Ext (ICE服务 + 数据分块)
    │ stdio IPC
    ▼
Electron 主进程 (路由转发 + 背压控制)
    │ ipcMain/ipcRenderer
    ▼
Electron 渲染进程 (React + 图形渲染)
```

---

**Enjoy!**
