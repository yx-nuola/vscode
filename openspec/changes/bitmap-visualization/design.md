## Context

本项目是一个 VS Code 扩展，包含 Electron 工作台和 WebView 两个前端模块。现有技术栈：
- React 19.2 + TypeScript 5.9
- Arco Design UI 组件库
- Vite 构建工具
- Electron 33（工作台部分）

需求来源：`src/webview/components/bitmap/index.md` - RRAM 测试结果可视化分析工具需求文档。

核心约束：
- 数据规模：128×1024 = 131,072 个单元格
- 性能要求：渲染 ≤ 2秒，交互响应 ≤ 0.5秒
- 文件解析：前端纯解析，无后端支持
- 文件格式：JSON、TXT、STDF

## Goals / Non-Goals

**Goals:**
- 实现高性能 128×1024 矩阵图渲染，满足性能指标
- 支持缩放/平移交互，便于查看细节
- 实现表格-图形双向联动定位
- 支持自定义颜色映射，实时预览
- 前端纯解析 JSON/TXT/STDF 文件

**Non-Goals:**
- 不支持 CSV/Excel 格式（后续扩展）
- 不实现数据编辑功能（仅展示）
- 不支持后端解析（纯前端）
- 不实现数据导出功能

## Decisions

### D1: 渲染引擎选择 - Konva.js

**决定**: 使用 Konva.js + react-konva 作为渲染引擎

**备选方案**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| Konva.js | Canvas 性能优秀、事件系统完善、React 友好 | 额外依赖 |
| 原生 Canvas | 无依赖、最高性能 | 事件处理复杂、开发效率低 |
| ECharts | 已安装、图表丰富 | 矩阵图非典型场景、定制困难 |
| SVG | 声明式、易调试 | 131k 节点性能差 |

**理由**: Konva.js 提供 Canvas 性能 + React 友好 API + 完善事件系统，平衡开发效率和运行性能。

### D2: 性能优化策略 - 分块渲染 + 虚拟化

**决定**: 采用分块渲染 + 可视区域虚拟化

**策略**:
1. **分块渲染**: 将 128×1024 矩阵分成 32×32 的块（共 128 块）
2. **可视区域渲染**: 仅渲染可视区域内的块
3. **缓存机制**: 使用 Konva.FastLayer 缓存静态背景
4. **防抖处理**: 缩放/平移时延迟渲染，使用 requestAnimationFrame

**理由**: 131k 单元格直接渲染会卡顿，分块 + 虚拟化可将实际渲染量降至 4k-10k。

### D3: 数据流架构 - 单向数据流 + Context

**决定**: 使用 React Context + useReducer 管理状态

**架构**:
```
FileParser (解析) → DataContext (状态管理) 
                            ↓
         ┌──────────────────┼──────────────────┐
         ↓                  ↓                  ↓
   BitmapCanvas        DataTable         ColorConfig
   (矩阵图渲染)        (表格展示)         (颜色配置)
         ↓                  ↓
         └──────── 鼠标事件 ─┘
                    ↓
             CellInfoPopup (信息弹窗)
```

**理由**: 多组件共享同一数据源，Context 提供简洁的状态共享机制，useReducer 处理复杂状态逻辑。

### D4: 文件解析架构 - 策略模式

**决定**: 使用策略模式实现多格式解析器

**结构**:
```
parsers/
├── index.ts          # ParserFactory
├── types.ts          # Parser 接口定义
├── JSONParser.ts     # JSON 格式解析
├── TXTParser.ts      # TXT 格式解析
└── STDFParser.ts     # STDF 格式解析
```

**接口**:
```typescript
interface Parser {
  parse(file: File): Promise<BitmapData>;
  validate(file: File): boolean;
}
```

**理由**: 策略模式便于扩展新格式，每个解析器独立测试。

### D5: 颜色映射实现 - CSS-in-JS + 预计算

**决定**: 颜色映射使用预计算 + CSS 变量

**实现**:
1. 用户配置颜色区间时，预计算所有可能值到颜色映射
2. 渲染时直接查表，不实时计算
3. 使用 CSS 变量支持主题切换

**理由**: 预计算避免渲染时计算开销，满足 0.5 秒交互响应要求。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| STDF 格式复杂，解析可能不完整 | 部分文件无法解析 | 1. 提供解析错误提示 2. 支持 JSON/TXT 替代方案 |
| 131k 单元格内存占用大 | 可能导致页面卡顿 | 1. 使用 TypedArray 存储数据 2. 按需加载数据块 |
| Konva.js 首次加载较慢 | 初始化延迟 | 1. 代码分割，按需加载 2. 显示加载进度 |
| 大文件上传阻塞 UI | 用户等待时间长 | 1. Web Worker 解析 2. 分块处理 |

## Migration Plan

本功能为新增模块，无需迁移。

**部署步骤**:
1. 安装依赖: `npm install konva react-konva`
2. 创建组件目录结构
3. 集成到 App.tsx（条件渲染）

**回滚策略**: 删除 bitmap 组件目录，移除 App.tsx 中的引用，卸载依赖。

## Open Questions

1. STDF 文件的具体格式规范？是否有示例文件？
2. 颜色区间配置是否需要持久化（localStorage）？
3. 表格-图形联动是否需要动画过渡效果？
4. 是否需要支持多个文件同时加载（追加模式）？
