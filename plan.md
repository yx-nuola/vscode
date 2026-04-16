# VSCode + Electron 图形化工作台开发计划

> 基于 `vsc-extension-Electron.md` 需求文档

## 项目概述
开发一款 VSCode 插件，通过 Electron 窗口展示图形化工作台，支持多卡片拖拽布局、ICE 服务数据渲染。

---

## 待办事项清单

### 阶段一：项目初始化

- [x] **1.1** 创建 plan.md 待办事项清单
- [x] **1.2** 初始化项目结构（VSCode插件 + Electron）
  - [x] package.json 配置
  - [x] TypeScript 配置
  - [x] 目录结构规划
  - [x] 依赖安装

### 阶段二：VSCode 插件模块 (Ext)

- [x] **2.1** 入口命令与 Electron 启动
  - [x] 注册 `extension.helloWorld` 命令
  - [x] 实现 Electron 进程启动（child_process.spawn）
  - [x] stdio IPC 通道配置
  - [x] 窗口状态管理

- [x] **2.2** ICE 服务调用与数据处理
  - [x] ICE 服务封装
  - [x] 数据分块处理（2000条/块）
  - [x] ArrayBuffer 转换
  - [x] 重试机制（最多3次）

- [x] **2.3** 通信管理
  - [x] 主进程通信句柄管理
  - [x] 背压控制配合
  - [x] 预测加载记录

### 阶段三：Electron 主进程模块

- [x] **3.1** 窗口管理
  - [x] BrowserWindow 创建（1200x800）
  - [x] webPreferences 配置
  - [x] 窗口事件监听

- [x] **3.2** IPC 通信
  - [x] ipcMain/ipcRenderer 配置
  - [x] 预加载脚本（contextBridge）
  - [x] 消息路由转发

- [x] **3.3** 背压控制与数据转发
  - [x] CHUNK_PROCESSED 监听
  - [x] 数据块转发（不做解析）
  - [x] 断连重连逻辑

### 阶段四：Electron 渲染进程模块

- [x] **4.1** React 基础结构与骨架屏
  - [x] React 18 项目搭建
  - [x] 骨架屏组件
  - [x] 懒加载配置

- [x] **4.2** react-grid-layout 拖拽布局
  - [x] 布局组件集成
  - [x] 可视区域监听
  - [x] CSS will-change 优化
  - [x] 布局持久化

- [x] **4.3** CardDataManager 数据管理
  - [x] 数据块缓存
  - [x] LRU 缓存实现
  - [x] 卡片数据生命周期

- [x] **4.4** Web Worker 数据解析
  - [x] Worker 线程创建
  - [x] 二进制数据解析
  - [x] Transferable 传递

- [x] **4.5** 图形渲染组件
  - [x] ECharts 图表组件
  - [x] LogicFlow 流程图组件
  - [x] Canvas 自定义图形组件
  - [x] 实例复用与销毁

### 阶段五：数据持久化模块

- [x] **5.1** electron-store 集成
  - [x] 布局保存（防抖500ms）
  - [x] 布局读取与校验
  - [x] 布局重置功能
  - [x] 会话记录保存

### 阶段六：通信协议与类型定义

- [x] **6.1** IPC 消息类型定义
  - [x] DataChunk 接口
  - [x] ExtToMain 控制消息
  - [x] MainToRenderer 数据消息
  - [x] RendererToMain 背压消息

### 阶段七：安全与优化

- [x] **7.1** 安全配置
  - [x] CSP 策略配置
  - [x] contextBridge API
  - [x] 来源校验

- [x] **7.2** 性能优化
  - [x] requestIdleCallback 分片渲染
  - [x] 数据采样策略
  - [x] IntersectionObserver 可视加载

### 阶段八：测试与打包

- [x] **8.1** 测试配置
  - [x] VSCode 测试环境（已配置）
  - [x] Electron 测试环境（可通过 `npm run start:electron` 测试）

- [x] **8.2** 打包配置
  - [x] VSCode 插件打包配置（.vsix）
  - [x] Electron 应用打包配置

---

## 下一步操作

1. **编译 Electron 主进程**：
   ```bash
   npm run build:electron
   ```

2. **启动 Electron 进行测试**：
   ```bash
   npm run start:electron
   ```

3. **测试 VSCode 插件**：
   ```bash
   npm run test
   ```

4. **打包 VSCode 插件**：
   ```bash
   npm run package
   ```

5. **开发 Electron 渲染进程**（如需热更新）：
   需要单独配置 Vite 开发服务器

---

## 进度记录

| 日期 | 完成项 | 备注 |
|------|--------|------|
| 2026-03-24 | 阶段一~七 | 核心框架和通信已完成 |

---

## 当前任务

> ✅ 已完成：核心框架、通信模块、ICE 服务调用
> 
> 🔄 待完成：测试与打包
