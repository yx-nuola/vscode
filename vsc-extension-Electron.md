

# 1. 文档概述
## 1.1 文档目的
项目开发VSCode插件中，想实现自由布局的图形化工作台， 支持拖拽， 但是的vscode的可扩展性低，自由度不够，现在想在vscode插件中，通过一个debug按钮，打开Electron应用窗口，展示debug Tool工作台，展示多种图形卡片。

## 1.2 项目背景
为提升VSCode编辑器的图形化操作能力，开发一款插件，可在VSCode内触发，弹出独立的Electron窗口作为图形化工作台，支持多卡片拖拽布局，加载并渲染来自ICE服务的大数据量图形数据（图表、流程图、画布等），不影响VSCode本身的正常使用。

## 1.3 核心目标
+ 开发VSCode插件，作为工作台入口，支持通过VSCode界面触发Electron窗口启动；
+ 实现Electron独立窗口，内置多卡片拖拽工作台，支持卡片拖拽、大小调整及布局保存；
+ 集成ECharts、LogicFlow、Canvas等图形渲染工具，实现各类图形的正常渲染；
+ 完成VSCode与Electron之间的高效通信，实现ICE服务数据的获取、传输与解析；
+ 确保所有功能稳定运行，满足大数据量场景下的正常使用，保障操作流畅性。

# 2. 核心技术选型（强制遵循）
所有技术选型需严格按照以下要求执行，不得随意替换，确保项目兼容性、稳定性及可维护性：

| **技术/工具** | **版本要求（建议）** | **核心用途** | **开发规范** |
| --- | --- | --- | --- |
| VSCode插件开发 | 遵循VSCode官方最新插件开发规范 | 项目入口，提供VSCode内操作入口（按钮/菜单），调用ICE服务，与Electron通信 | 1. 遵循VSCode Extension API规范；2. 代码结构清晰，拆分入口、通信、ICE调用等模块；3. 提供错误处理及日志输出 |
| Electron | 18+ | 创建独立图形工作台窗口，承载卡片布局及图形渲染，与VSCode插件通信 | 1. 开启硬件加速（webPreferences.hardwareAcceleration: true）；2. 启用IPC通信，关闭不必要的沙箱（sandbox: false）；3. 窗口创建需异步执行，避免阻塞 |
| React | 18+ | 开发Electron窗口内前端界面，实现卡片布局、组件渲染及交互逻辑 | 1. 采用函数式组件+Hook开发；2. 组件拆分合理，实现懒加载；3. 状态管理清晰，避免冗余渲染 |
| react-grid-layout | 最新稳定版 | 实现工作台多卡片拖拽、大小调整、布局保存及可视区域识别 | 1. 监听布局变化事件，获取可视卡片列表；2. 支持布局持久化（本地存储）；3. 拖拽事件需与图形渲染联动；4. 使用 CSS will-change 优化拖拽性能，避免暂停所有渲染 |
| ECharts/LogicFlow/Canvas | 最新稳定版 | ECharts渲染图表，LogicFlow渲染流程图，Canvas实现自定义图形渲染 | 1. 图形实例需复用，避免重复初始化；2. 支持数据追加渲染，不支持一次性全量渲染；3. 提供加载状态提示 |
| ICE服务调用 | 遵循ICE服务官方API规范 | 获取图形渲染所需的原始数据（坐标、节点等） | 1. 调用逻辑封装在VSCode插件层；2. 支持数据批量获取，返回数据需按卡片维度分类；3. 增加调用失败重试及错误处理 |
| IPC通信 | Electron内置IPC + Node.js child_process IPC | 实现VSCode与Electron、Electron主进程与渲染进程之间的数据传输 | 1. 采用三层IPC架构：stdio IPC（VSCode Ext ↔ Electron主进程）→ ipcMain/ipcRenderer（Electron主进程 ↔ 渲染进程）；2. 大数据传输使用流式分块+Transferable对象；3. 渲染进程内部使用MessageChannel避免主线程阻塞 |
| Web Worker | 浏览器原生支持 | 后台解析二进制数据，避免阻塞Electron渲染进程主线程 | 1. 数据解析逻辑封装在Worker中；2. 主线程仅接收解析结果，不参与解析过程；3. 处理Worker异常及销毁逻辑 |
| LRU数据缓存 | lru-cache 或自定义实现 | 按卡片维度缓存已加载数据，内存超限时释放最久未使用的数据 | 1. 缓存容量限制（如10MB/卡片）；2. 支持按卡片ID主动清理；3. 与electron-store配合实现布局+数据缓存 |
| electron-store | 最新稳定版 | 持久化保存工作台卡片布局，下次启动时自动恢复 | 1. 布局数据实时保存（防抖处理）；2. 支持布局重置功能；3. 异常布局自动修复 |


# 3. 窗口打开时机策略（开发必遵循）
窗口打开时机直接影响用户体验和数据加载效率，需严格按照以下策略执行。

## 3.1 窗口打开流程

| 阶段 | 时间节点 | 执行操作 | 耗时目标 |
| --- | --- | --- | --- |
| T0 | 0ms | 显示骨架屏（灰色占位框，样式与卡片布局一致） | 即时 |
| T1 | 0-50ms | 恢复布局，初始化卡片容器，初始化CardDataManager | < 50ms |
| T2 | 50-200ms | 预测加载：根据上次会话记录，优先加载上次关闭时可见的卡片 | 150ms |
| T3 | 200ms+ | 首个卡片渲染完成，用户可进行交互 | 用户无感知 |
| T4 | 滚动时 | 加载可视区域内的卡片，支持预加载下一个即将可见的卡片 | 按需 |

## 3.2 窗口打开时机策略

### 3.2.1 骨架屏优先
+ 窗口打开后立即显示骨架屏，替代白屏，确保用户感知到应用已启动
+ 骨架屏样式与卡片布局一致，预留卡片位置

### 3.2.2 预测加载
+ 基于上次会话记录，预测用户最可能查看的卡片，优先加载
+ 上次关闭时处于可视区域的卡片优先级最高

### 3.2.3 LRU数据缓存
+ 渲染进程启动时初始化LRU缓存，按卡片维度缓存已加载数据
+ 内存超限时自动释放最久未使用的卡片数据
+ 用户再次查看已释放的卡片时，重新从VSCode Ext请求数据

### 3.2.4 可视区域加载
+ 使用IntersectionObserver监听卡片可视状态
+ 卡片首次进入可视区域时，初始化图形实例并渲染数据
+ 非可视卡片仅保留数据缓存，不渲染图形


# 4. 核心通信流程（开发必遵循）
项目包含3类通信场景，所有通信逻辑需严格按照以下流程开发，确保数据传输高效、稳定，避免冗余传输及数据丢失。

## 4.1 VSCode内部通信（VSCode View ↔ VSCode Ext）
### 4.1.1 触发场景
插件启动之后，使用childProcess的spawn，启动Electron应用，用户点击VSCode界面（View）中的按钮/菜单，view发送消息到ext, 然后ext传递数据（路由，数据， 类型-窗口）， 触发VSCode插件（Ext）的核心逻辑（调用ICE服务）。

### 4.1.2 通信规范
+ 采用VSCode官方API（vscode.commands.registerCommand）注册命令，实现View到Ext的触发；
+ 通信数据仅为操作指令（如"启动工作台""刷新数据"），不传输大数据；
+ Ext接收指令后，需返回操作状态（成功/失败），并在VSCode底部状态栏给出提示。

## 4.2 VSCode Ext ↔ Electron通信（核心通信）
### 4.2.1 通信目标
实现VSCode Ext与Electron渲染进程的**三层IPC通信**：
1. VSCode Ext ↔ Electron主进程：通过 stdio IPC（child_process.spawn 的第四个通道）
2. Electron主进程 ↔ Electron渲染进程：通过 ipcMain/ipcRenderer
3. 渲染进程内部：使用 MessageChannel 在子组件间传递数据，避免主线程阻塞

### 4.2.2 通信架构图

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ VSCode Ext  │◄───────►│ Electron    │◄───────►│ Electron    │
│             │  stdio  │ 主进程      │   ipc   │ 渲染进程    │
│ - ICE调用   │  IPC    │ - 窗口管理  │ Main/   │ - React UI  │
│ - 数据分块  │         │ - 路由转发  │Renderer │ - 图形渲染  │
│ - 状态管理  │         │ - 背压控制  │         │ - Worker    │
└─────────────┘         └─────────────┘         └─────────────┘
```

### 4.2.3 通信协议定义

#### 4.2.3.1 数据块格式
```typescript
interface DataChunk {
  cardId: string;           // 卡片标识
  chunkIndex: number;       // 当前块序号
  totalChunks: number;      // 总块数
  isLast: boolean;          // 是否最后一块
  data: ArrayBuffer;        // 二进制数据（使用Transferable传递）
}
```

#### 4.2.3.2 控制消息
```typescript
// VSCode Ext → Electron 主进程
type ExtToMain = 
  | { type: 'LOAD_DATA'; cardIds: string[] }      // 请求加载指定卡片数据
  | { type: 'CANCEL_LOAD'; cardIds?: string[] }  // 取消加载（可选）

// Electron 主进程 → 渲染进程
type MainToRenderer =
  | { type: 'DATA_CHUNK'; cardId: string; chunk: ArrayBuffer; meta: { index: number; total: number } }
  | { type: 'DATA_COMPLETE'; cardId: string }
  | { type: 'DATA_ERROR'; cardId: string; error: string }

// 渲染进程 → Electron 主进程（背压控制）
type RendererToMain = 
  | { type: 'CHUNK_PROCESSED'; cardId: string; chunkIndex: number }  // 通知主进程当前块已处理
  | { type: 'REQUEST_MORE'; cardId: string }                            // 请求下一块数据
```

### 4.2.4 通信流程（开发步骤）
1. VSCode Ext通过child_process.spawn方法启动Electron进程，启动时必须配置stdio: ['pipe', 'pipe', 'pipe', 'ipc']，开启IPC通道；
2. Electron主进程启动后，创建BrowserWindow窗口，配置webPreferences相关参数（开启硬件加速、预加载脚本）；
3. Electron窗口加载完成（监听ready-to-show事件）后，Electron主进程通过process.send()方法通知VSCode Ext窗口已就绪；
4. VSCode Ext接收就绪通知后，保存主进程通信句柄（processHandle）；
5. VSCode Ext调用ICE服务获取数据后，将数据按卡片维度分类，并按2000条/块进行分块；
6. VSCode Ext通过processHandle.send()方法发送数据块到Electron主进程；
7. Electron主进程接收数据块后，立即通过ipcRenderer.send()转发给渲染进程（不做解析，不做存储）；
8. 渲染进程接收数据块后，通过背压机制（CHUNK_PROCESSED）通知主进程，主进程再请求下一块；
9. 通信容错：发送数据前需判断process.connected是否为true，若断开，缓存数据并重连；
10. 数据传输格式：每批次数据间隔50ms（根据背压反馈动态调整），避免阻塞主线程。

### 4.2.5 渲染进程内部数据流
1. 渲染进程接收数据块后，直接传递给Web Worker解析（使用Transferable转移所有权）；
2. Web Worker解析完成后，通过postMessage返回解析结果；
3. 渲染进程将解析结果存入CardDataManager，按卡片ID组装完整数据；
4. CardDataManager通知对应卡片组件进行渲染；
5. 卡片组件使用requestIdleCallback分片渲染，避免阻塞主线程。

## 4.3 Electron内部通信（Electron主进程 ↔ 渲染进程）
### 4.3.1 通信场景
1. Electron主进程向渲染进程转发数据块；
2. 渲染进程向主进程反馈处理状态（背压控制）；
3. 渲染进程向主进程请求本地存储（布局保存/读取）；
4. 渲染进程向主进程反馈窗口状态。

### 4.3.2 通信规范
+ 采用Electron内置ipcMain（主进程）和ipcRenderer（渲染进程）实现通信；
+ 预加载脚本（preload/index.js）需通过contextBridge暴露安全的IPC API，禁止直接暴露ipcRenderer；
+ 渲染进程监听VSCode Ext直接发送的消息，需在预加载脚本中封装监听方法，避免直接使用ipcRenderer.on()；
+ 主进程仅负责窗口管理、IPC转发及本地存储操作，不参与数据解析及图形渲染逻辑。

## 4.4 CardDataManager 数据管理（渲染进程内部）
### 4.4.1 核心功能
```typescript
class CardDataManager {
  private dataCache: Map<string, Map<number, ArrayBuffer>>;  // 数据块缓存
  private lruCache: LRUCache<string, ParsedData>;             // 解析后数据LRU缓存
  private pendingRender: Set<string>;                          // 待渲染卡片集合

  addChunk(cardId: string, chunkIndex: number, data: ArrayBuffer): void;
  assembleData(cardId: string): ArrayBuffer | null;
  parseData(cardId: string): Promise<ParsedData>;
  renderCard(cardId: string): void;
  releaseCard(cardId: string): void;  // 释放卡片数据，保留在LRU缓存
  clearCache(): void;
}
```

### 4.4.2 数据生命周期
1. 数据块到达 → 存入dataCache
2. 数据块组装完成 → 调用Web Worker解析
3. 解析完成 → 存入LRU缓存，触发渲染
4. 卡片不可见 → 保留数据在LRU缓存
5. 内存不足 → 释放最久未使用的卡片数据


# 5. 功能模块开发需求
项目分为4个核心模块，每个模块的开发要求需严格遵循以下规范，确保功能完整、交互流畅。

## 5.1 VSCode插件模块（Ext）
### 5.1.1 功能需求
+ 入口功能：在VSCode编辑器添加按钮（或菜单），点击后触发Electron窗口启动，启动失败时给出错误提示；
+ ICE服务调用：封装ICE服务调用方法，按卡片维度获取图形数据，支持失败重试（最多3次，每次间隔500ms），调用超时时间设置为5s；
+ 数据处理：将ICE服务返回的原始数据按卡片分类，按2000条/块分块，转换为ArrayBuffer二进制格式，存储在内存中等待发送；
+ 通信管理：管理与Electron主进程的通信连接，实现数据块流式发送，配合背压反馈控制发送节奏；
+ 状态提示：在VSCode状态栏显示操作状态（Electron窗口启动中、数据传输中、操作成功/失败）；
+ 预测加载：记录用户关闭窗口时处于可视区域的卡片ID，窗口启动时优先加载。

### 5.1.2 开发规范
+ 代码拆分：将入口指令、ICE调用、通信管理拆分为独立模块，便于维护；
+ 错误处理：捕获ICE服务调用、Electron启动、通信过程中的所有异常，给出明确的错误日志及用户提示；
+ 资源释放：Electron窗口关闭后，释放通信句柄，终止ICE服务请求，避免内存泄漏。

## 5.2 Electron主进程模块
### 5.2.1 功能需求
+ 窗口管理：异步创建BrowserWindow窗口，配置窗口大小（默认1200*800）、可拖拽、可缩放，监听窗口关闭事件，移除窗口引用及本地缓存；
+ 通信转发：接收VSCode Ext发送的数据块，通过ipcRenderer转发给渲染进程，不做解析，不做存储；
+ 背压控制：监听渲染进程的CHUNK_PROCESSED消息，控制从VSCode Ext请求下一块的节奏；
+ 布局持久化：通过electron-store实现工作台布局的保存与读取，监听渲染进程发送的布局变化消息，防抖500ms后保存布局；
+ 窗口状态管理：监听窗口加载、显示、关闭等事件，向VSCode Ext反馈窗口状态。

### 5.2.2 开发规范
+ 窗口创建：使用setImmediate异步创建窗口，避免阻塞VSCode Ext进程；
+ 句柄传递：仅在窗口ready-to-show事件触发后，通知VSCode Ext窗口已就绪；
+ 资源管理：窗口关闭时，删除windowMap中的窗口引用，清理IPC监听，释放资源。

## 5.3 Electron渲染进程模块（工作台界面）
### 5.3.1 功能需求
#### 5.3.1.1 窗口初始化
+ 启动后显示骨架屏（灰色占位框），替代白屏，骨架屏样式与卡片布局一致；
+ 加载本地保存的布局，若无保存布局，使用默认布局（2行2列卡片，包含图表、流程图、画布等默认卡片）；
+ 组件懒加载：采用React.lazy+Suspense，分批次加载卡片组件，不一次性加载所有组件。

#### 5.3.1.2 卡片拖拽布局
+ 基于react-grid-layout实现多卡片拖拽、调整大小、拆分、合并功能；
+ 监听布局变化事件，获取当前可视卡片列表，仅渲染可视区域内的卡片，非可视区域显示占位框；
+ 拖拽优化：使用 CSS will-change: transform 提升拖拽性能，无需暂停所有图形渲染；
+ 支持卡片关闭、新增功能，新增卡片可选择图形类型（图表/流程图/画布）。

#### 5.3.1.3 数据解析与图形渲染
+ 通过预加载脚本暴露的API，监听Electron主进程转发的数据块；
+ 使用Web Worker解析二进制数据，解析完成后将结果传递给主线程，主线程仅负责状态更新，不参与解析；
+ CardDataManager管理数据缓存，支持LRU策略释放内存；
+ 图形渲染：ECharts/LogicFlow/Canvas实例复用，仅在卡片首次可视时初始化实例；
+ 数据分片渲染：使用requestIdleCallback逐批渲染，单批次渲染1000条数据；
+ 加载状态：每张卡片显示加载提示（"加载中..."），数据加载完成后隐藏提示，渲染图形；
+ 图形交互：支持图形缩放、平移、hover提示等基础交互，交互过程中不卡顿。

### 5.3.2 开发规范
+ 组件拆分：将卡片组件、布局组件、图形组件拆分为独立组件，组件之间通过props传递数据，避免状态混乱；
+ 性能控制：使用React.memo、useMemo、useCallback优化组件重渲染，避免不必要的性能损耗；
+ 异常处理：捕获图形渲染、数据解析、IPC通信中的异常，显示错误提示，支持重新加载数据；
+ 资源释放：组件卸载时，销毁图形实例、取消IPC监听、终止Web Worker，避免内存泄漏。

## 5.4 数据持久化模块
### 5.4.1 功能需求
+ 布局保存：监听卡片拖拽、大小调整、新增/关闭事件，防抖500ms后保存当前布局到本地（electron-store）；
+ 布局读取：Electron渲染进程启动时，读取本地保存的布局，若布局异常，自动恢复为默认布局；
+ 布局重置：提供布局重置按钮，点击后恢复为默认布局，同时更新本地保存的布局；
+ 会话记录：保存用户关闭窗口时处于可视区域的卡片ID，用于下次启动时的预测加载。

### 5.4.2 开发规范
+ 布局数据格式：统一格式，包含卡片位置、大小、类型、顺序等信息，确保跨设备兼容性；
+ 数据校验：读取布局时，校验数据完整性，若数据缺失或异常，自动修复并提示用户；
+ 存储路径：遵循Electron-store默认存储路径，确保数据持久化稳定。


# 6. 开发标准与约束
## 6.1 代码规范
+ 代码风格：遵循ESLint规范，变量命名清晰（驼峰命名），注释完整（关键逻辑、函数用途、参数说明）；
+ 模块化开发：所有功能按模块拆分，避免代码冗余，便于后期维护和扩展；
+ 错误处理：所有异步操作（IPC通信、ICE调用、数据解析）必须包含try-catch，给出明确的错误日志；
+ 兼容性：支持Windows、macOS、Linux三大系统，Electron窗口适配不同屏幕分辨率。

## 6.2 性能约束（开发必满足）
| 指标 | 约束 | 说明 |
| --- | --- | --- |
| 骨架屏显示 | ≤ 50ms | 窗口打开到骨架屏显示的时间 |
| 首个卡片渲染 | ≤ 500ms | 从骨架屏到首个卡片渲染完成 |
| 数据传输 | 单块2000条 ≤ 20ms | 每块数据传输时间（包含IPC开销） |
| 图形渲染（10万条） | 首次渲染 ≤ 2s | 使用分片渲染+虚拟化 |
| 图形交互 | 帧率 ≥ 30FPS | 缩放、平移等交互 |
| 拖拽响应 | ≤ 50ms | 卡片拖拽响应时间 |
| 拖拽帧率 | ≥ 60FPS | 使用CSS优化，无需暂停渲染 |
| 内存占用（空载） | ≤ 150MB | 无数据时的内存占用 |
| 内存占用（满载） | ≤ 400MB | 加载10万条数据后的内存占用 |

**性能优化说明**：
+ 10万条数据建议使用数据采样或虚拟化，展示1000-2000条关键数据；
+ 大数据量场景下，优先保证交互流畅，而非一次性全量渲染；
+ 使用Chrome DevTools Performance面板持续监控性能。

## 6.3 安全约束
+ Electron窗口配置：开启contextIsolation: true，禁用nodeIntegration: false，避免安全漏洞；
+ IPC通信：仅暴露必要的API，禁止暴露敏感方法（如文件操作、进程管理），添加通信来源校验；
+ 数据传输：二进制数据传输前进行校验，避免恶意数据导致解析异常；
+ Content Security Policy：配置CSP策略，限制外部资源加载；
+ 资源释放：所有进程、实例、监听在不需要时及时销毁，避免内存泄漏及资源浪费。

## 6.4 安全策略（CSP示例）
```javascript
// main.js
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "connect-src 'self' ws://localhost:*;"
      ]
    }
  });
});
```


# 7. 交付物要求
+ 源代码：完整的VSCode插件源代码、Electron主进程/渲染进程源代码，代码结构清晰，注释完整；
+ 打包文件：VSCode插件安装包（.vsix）、Electron应用打包文件（Windows/ macOS/ Linux）；
+ 开发文档：详细的开发说明、接口文档（ICE服务调用、IPC通信接口）、部署说明；
+ 测试报告：包含功能测试、性能测试（窗口启动时间、数据传输时间、渲染帧率）、兼容性测试结果。


# 8. 备注
+ 所有开发需严格遵循本文档中的技术选型、通信流程及功能需求，不得随意修改核心逻辑；
+ 若遇到技术难点或需求歧义，需及时沟通确认，避免开发偏差；
+ 开发过程中需注重代码可维护性和扩展性，便于后续新增卡片类型、优化功能。
