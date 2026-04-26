# Bitmap Grid Design Review & Improvements

## 一、设计评估

### 1.1 原设计优点

✅ **分层架构合理**：方案四（三层架构）确实是一个很好的设计，能够优化性能
✅ **模块化设计**：目录结构清晰，职责划分明确
✅ **性能优化策略全面**：虚拟滚动、对象池、RAF 调度、分层渲染等
✅ **接口设计**：定义了清晰的接口
✅ **数据流设计**：各种流程都有详细说明

### 1.2 原设计确认正确的点

✅ **坐标轴和滚动条无位置冲突**：X 轴、Y 轴、横向滚动条、纵向滚动条各自占用独立区域，中间为网格绘制区域，所有区域通过统一计算确定位置，不重叠、无冲突
✅ **滚动条和坐标轴无高耦合**：横向滚动时仅需更新 X 轴标签，横向滚动条滑块无需更新；纵向滚动时仅需更新 Y 轴标签，纵向滚动条滑块无需更新。两者触发逻辑分离

### 1.3 存在的问题

❌ **虚拟滚动和滚动条的同步**：原设计未提及同步细节，需补充滚动条与虚拟滚动位置同步的实现方案
⚠️ **定位功能的边界处理**：原设计未详细说明，采用简单可靠方式——确保目标格子完整显示在可视区域内即可
✅ **颜色映射无需内置缓存**：颜色映射规则由外部传入，组件内部仅接收并按值判断色值绘制
✅ **表格-图形联动无需防抖**：联动仅点击触发（表格行→图形、图形格子→表格），非高频同步，性能无压力
⚠️ **内存管理需补充按区域获取数据**：数据从本地文件读取，量级10万～100万，需采用按区域获取数据的方式优化内存
⚠️ **事件处理需补充优化逻辑**：事件包含画布缩放、滚动、坐标轴更新等，优化逻辑需补充设计
✅ **响应式布局已明确**：VS Code 插件环境，固定图形60%、表格40%布局，图形宽度继承父容器并自适应
⏭️ **错误处理暂不实现**
⏭️ **可访问性暂不实现**
⏭️ **国际化暂不实现**
⚠️ **主题切换需补充实例级主题参数**：摒弃全局统一配置，各图形实例创建时传入主题色参数，内部独立完成样式适配
⏭️ **数据导入优化暂不实现**：当前仅支持本地JSON文件读取解析
⏭️ **滚动条自定义取消**：采用系统默认滚动条样式
⚠️ **坐标轴样式需补充主题适配**：固定布局（X轴顶部、Y轴左侧），颜色跟随主题自适应
⚠️ **格子交互需补充设计**：支持点击/悬停，外部可获取位置信息，支持定位+高亮
⚠️ **缩放边界需补充设计**：设置最大/最小/默认缩放值，自动限制范围
⚠️ **选择性能需补充设计**：以坐标定位为核心，对定位渲染、滚动交互专项优化
⏭️ **数据更新暂不实现**

## 二、改进建议

### 2.1 坐标轴和滚动条的空间布局（已确认正确）

**澄清**：不存在位置冲突。X 轴、Y 轴、横向滚动条、纵向滚动条各自占用独立区域，中间为网格绘制区域，所有区域通过统一计算确定位置，不重叠、无冲突。

**布局示意**：
```
┌───────────────────────────────────────────────────────────────────────┐
│ ↖ ↗ ■ □  x1  +  -  Top                                                │
│ ┌───┐                                                                 │
│ │Y/X│  0    40    80    120   160   200   240   280                   │
│ └───┘ ┌───────────────────────────────────────────────────────────────|
│ 100 ┤ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ ▲ │
│     │ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│ 200 ┤ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│     │ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│ 240 ┤ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│     │ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│ 280 ┤ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│     │ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ █ │
│ 300 ┤ │▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌│ │ ▼ │
│     │ └─────────────────────────────────────────────────────────┘ │   │
├─────┴─────────────────────────────────────────────────────────────┼───┤
│     |<──────────────────────────────────────────────────────────> │   │
└───────────────────────────────────────────────────────────────────────┘
```

**区域说明**：
- **工具栏区域（Toolbar）**：顶部，包含缩放按钮、定位按钮等工具操作，高度 toolbarHeight
- **X 轴区域**：工具栏下方，Y 轴右侧，显示列号/WL 刻度标签，高度 xAxisHeight
- **Y 轴区域**：左侧，显示行号/BL 刻度标签，宽度 yAxisWidth
- **Y/X 角落**：左上角 Y 轴与 X 轴交汇的小区域，属于 Y 轴区域的一部分
- **网格绘制区域（CellLayer）**：中间主区域，渲染格子矩阵
- **横向滚动条区域**：底部，网格区域下方
- **纵向滚动条区域**：右侧，网格区域右方
- **右下角**：横向滚动条与纵向滚动条的交汇区域

**统一空间计算**：
```typescript
interface LayoutConfig {
  toolbarHeight: number;   // 工具栏区域高度（如 40px）
  xAxisHeight: number;     // X 轴区域高度（含刻度+标签，如 30px）
  yAxisWidth: number;      // Y 轴区域宽度（含刻度+标签，如 50px）
  scrollbarHeight: number; // 横向滚动条高度（如 12px）
  scrollbarWidth: number;  // 纵向滚动条宽度（如 12px）
  spacing: number;         // 区域间距（如 2px）
}

// 统一计算各区域位置，所有 Layer 共享此配置
function calculateLayout(config: LayoutConfig, containerWidth: number, containerHeight: number) {
  const toolbarY = 0;
  const xAxisY = config.toolbarHeight + config.spacing;
  const cellAreaX = config.yAxisWidth + config.spacing;
  const cellAreaY = xAxisY + config.xAxisHeight + config.spacing;
  const cellAreaWidth = containerWidth - config.yAxisWidth - config.spacing - config.scrollbarWidth - config.spacing;
  const cellAreaHeight = containerHeight - cellAreaY - config.spacing - config.scrollbarHeight - config.spacing;

  return {
    toolbar: { x: 0, y: toolbarY, width: containerWidth, height: config.toolbarHeight },
    xAxis: { x: cellAreaX, y: xAxisY, width: cellAreaWidth, height: config.xAxisHeight },
    yAxis: { x: 0, y: cellAreaY, width: config.yAxisWidth, height: cellAreaHeight },
    cellArea: { x: cellAreaX, y: cellAreaY, width: cellAreaWidth, height: cellAreaHeight },
    horizontalScrollbar: { x: cellAreaX, y: containerHeight - config.scrollbarHeight, width: cellAreaWidth, height: config.scrollbarHeight },
    verticalScrollbar: { x: containerWidth - config.scrollbarWidth, y: cellAreaY, width: config.scrollbarWidth, height: cellAreaHeight },
  };
}
```

### 2.2 滚动条和坐标轴的触发逻辑（已确认正确）

**澄清**：不存在高耦合问题。横向滚动时仅需更新 X 轴标签，横向滚动条滑块无需更新；纵向滚动时仅需更新 Y 轴标签，纵向滚动条滑块无需更新。两者触发逻辑分离。

**触发逻辑说明**：
- **横向滚动**（用户滚动鼠标滚轮或拖拽横向滚动条）：
  - ✅ 更新 X 轴标签（根据 scrollX 偏移重新计算可见列的标签）
  - ❌ 横向滚动条滑块位置不变（滑块大小和位置由数据总量/视口比例决定，与滚动偏移无关）
- **纵向滚动**（用户滚动鼠标滚轮或拖拽纵向滚动条）：
  - ✅ 更新 Y 轴标签（根据 scrollY 偏移重新计算可见行的标签）
  - ❌ 纵向滚动条滑块位置不变（同理）

**实现方式**：通过 EventBus 事件分发，各自订阅所需事件，无需互相感知：
```typescript
// 滚动事件触发时，仅通知坐标轴更新标签
eventBus.on('scroll:horizontal', (scrollX: number) => {
  xAxisManager.updateLabels(scrollX);  // 仅更新 X 轴标签
});

eventBus.on('scroll:vertical', (scrollY: number) => {
  yAxisManager.updateLabels(scrollY);  // 仅更新 Y 轴标签
});

// 滚动条拖拽触发滚动，但不更新滚动条自身滑块位置
eventBus.on('scrollbar:horizontal-drag', (scrollX: number) => {
  scrollManager.setScrollX(scrollX);       // 更新滚动位置
  eventBus.emit('scroll:horizontal', scrollX);  // 通知 X 轴更新
  cellLayer.renderVisibleCells();           // 重新渲染可见格子
});
```

### 2.3 虚拟滚动和滚动条的同步（补充设计）

**说明**：原设计未提及虚拟滚动与滚动条的同步细节，此部分为补充设计。

**核心问题**：虚拟滚动只渲染可见区域的格子，但滚动条需要反映整个数据集的滚动位置和比例，两者需要双向同步。

**同步机制设计**：

1. **滚动条反映数据规模**：
   - 滑块大小 = 视口大小 / 数据总大小 × 滚动条轨道长度
   - 滑块位置 = 当前滚动偏移 / 最大滚动偏移 × (轨道长度 - 滑块大小)

2. **滚动条拖拽 → 虚拟滚动**：
   - 用户拖拽滚动条滑块 → 计算对应的 scrollX/scrollY → 通知 VirtualScrollManager 更新可见区域

3. **鼠标滚轮/键盘 → 虚拟滚动 → 滚动条**：
   - 用户滚动鼠标 → 更新 scrollX/scrollY → 通知滚动条更新滑块位置

```typescript
class VirtualScrollSync {
  private totalCols: number;      // 数据总列数（如 128）
  private totalRows: number;      // 数据总行数（如 1024）
  private cellWidth: number;      // 单个格子宽度（如 10px）
  private cellHeight: number;     // 单个格子高度（如 10px）
  private viewportWidth: number;  // 可视区域宽度
  private viewportHeight: number; // 可视区域高度

  // 数据总尺寸（像素）
  get totalWidth() { return this.totalCols * this.cellWidth; }
  get totalHeight() { return this.totalRows * this.cellHeight; }

  // 最大滚动偏移
  get maxScrollX() { return Math.max(0, this.totalWidth - this.viewportWidth); }
  get maxScrollY() { return Math.max(0, this.totalHeight - this.viewportHeight); }

  // 计算可见格子范围
  getVisibleRange(scrollX: number, scrollY: number) {
    const startCol = Math.floor(scrollX / this.cellWidth);
    const startRow = Math.floor(scrollY / this.cellHeight);
    const endCol = Math.min(this.totalCols - 1, Math.ceil((scrollX + this.viewportWidth) / this.cellWidth));
    const endRow = Math.min(this.totalRows - 1, Math.ceil((scrollY + this.viewportHeight) / this.cellHeight));
    return { startCol, endCol, startRow, endRow };
  }

  // 计算滚动条滑块尺寸和位置
  getScrollbarState(scrollX: number, scrollY: number, trackWidth: number, trackHeight: number) {
    // 滑块大小：视口占总数据的比例
    const thumbWidth = Math.max(20, (this.viewportWidth / this.totalWidth) * trackWidth);
    const thumbHeight = Math.max(20, (this.viewportHeight / this.totalHeight) * trackHeight);

    // 滑块位置：当前滚动偏移占最大偏移的比例
    const maxThumbX = trackWidth - thumbWidth;
    const maxThumbY = trackHeight - thumbHeight;
    const thumbX = this.maxScrollX > 0 ? (scrollX / this.maxScrollX) * maxThumbX : 0;
    const thumbY = this.maxScrollY > 0 ? (scrollY / this.maxScrollY) * maxThumbY : 0;

    return { thumbX, thumbY, thumbWidth, thumbHeight };
  }

  // 滚动条拖拽：从滑块位置反算滚动偏移
  getScrollFromThumb(thumbX: number, thumbY: number, trackWidth: number, trackHeight: number) {
    const thumbWidth = Math.max(20, (this.viewportWidth / this.totalWidth) * trackWidth);
    const thumbHeight = Math.max(20, (this.viewportHeight / this.totalHeight) * trackHeight);
    const maxThumbX = trackWidth - thumbWidth;
    const maxThumbY = trackHeight - thumbHeight;

    const scrollX = maxThumbX > 0 ? (thumbX / maxThumbX) * this.maxScrollX : 0;
    const scrollY = maxThumbY > 0 ? (thumbY / maxThumbY) * this.maxScrollY : 0;
    return { scrollX, scrollY };
  }
}
```

**数据流**：
```
鼠标滚轮 / 键盘滚动
    │
    ▼
ScrollManager.updateScroll(deltaX, deltaY)
    │
    ├──► clamp(scrollX, scrollY)  边界限制
    │
    ├──► VirtualScrollSync.getVisibleRange(scrollX, scrollY)
    │       │
    │       ▼
    │    CellLayer.renderCells(startCol..endCol, startRow..endRow)
    │
    ├──► XAxisManager.updateLabels(scrollX)
    │
    ├──► YAxisManager.updateLabels(scrollY)
    │
    └──► ScrollbarManager.updateThumb(scrollX, scrollY)
            │
            ▼
         更新滑块位置（getScrollbarState 计算后绘制）

─────────────────────────────────────────

滚动条拖拽
    │
    ▼
ScrollbarManager.onDrag(thumbX, thumbY)
    │
    ▼
VirtualScrollSync.getScrollFromThumb(thumbX, thumbY)
    │
    ▼
ScrollManager.setScroll(scrollX, scrollY)  → 同上流程
```

### 2.4 定位功能的边界处理（已澄清，简化方案）

**澄清**：采用简单可靠方式实现，确保目标格子完整显示在可视区域内即可，无需复杂的居中计算。

**问题**：原设计未详细说明如何处理边界情况

**解决方案**：
**解决方案**（简单可靠）：
```typescript
class LocationManager {
  /**
   * 定位到目标格子——确保目标格子完整显示在可视区域内
   */
  locateToCell(col: number, row: number): void {
    const cellX = col * this.cellWidth;
    const cellY = row * this.cellHeight;
    let scrollX = this.scrollX;
    let scrollY = this.scrollY;

    // 横向：目标格子不在可视区域时，最小幅度滚动使其可见
    if (cellX < scrollX) {
      scrollX = cellX;
    } else if (cellX + this.cellWidth > scrollX + this.viewportWidth) {
      scrollX = cellX + this.cellWidth - this.viewportWidth;
    }

    // 纵向：同理
    if (cellY < scrollY) {
      scrollY = cellY;
    } else if (cellY + this.cellHeight > scrollY + this.viewportHeight) {
      scrollY = cellY + this.cellHeight - this.viewportHeight;
    }

    // 边界钳制
    this.scrollX = clamp(scrollX, 0, this.maxScrollX);
    this.scrollY = clamp(scrollY, 0, this.maxScrollY);
  }
}
```

### 2.5 颜色映射（已确认正确，无需内置缓存）

**澄清**：颜色映射规则由外部传入，组件内部仅接收并按值判断色值绘制，无需内置复杂缓存。

**设计说明**：
- 外部通过 props/config 传入颜色规则数组（如 `[{ range: [0, 5], color: '#FFA500' }, { range: [5, 10], color: '#0000FF' }]`）
- 组件内部遍历规则，按值匹配第一个满足条件的颜色，直接用于格子绘制
- 无需缓存：规则数量有限（通常 3~10 条），遍历成本极低；若外部规则本身需要缓存，由外部自行管理

```typescript
// 组件内部颜色映射：简单、无状态、无缓存
function mapColor(value: number, rules: ColorRule[]): string {
  for (const rule of rules) {
    if (value >= rule.min && value < rule.max) {
      return rule.color;
    }
  }
  return defaultColor;
}
```

### 2.6 表格-图形联动（已确认正确，无需防抖）

**澄清**：联动仅点击触发（表格行→图形、图形格子→表格），非高频同步，性能无压力。

**设计说明**：
- 点击表格行 → 调用 `locateToCell(col, row)` 定位到对应格子 → 高亮该格子
- 点击图形格子 → 通知表格滚动到对应行 → 高亮该行
- 点击事件频率低，单次操作仅涉及一次定位 + 一次高亮，无需防抖/节流

```typescript
// 表格行点击 → 图形定位
function handleTableRowClick(cell: CellData) {
  bitmapGrid.locateToCell(cell.col, cell.row);
  bitmapGrid.highlightCell(cell.col, cell.row);
}

// 图形格子点击 → 表格定位
function handleCellClick(cell: CellData) {
  dataTable.scrollToRow(cell.row);
  dataTable.highlightRow(cell.row);
}
```

### 2.7 内存管理（补充设计：按区域获取数据）

**澄清**：数据从本地文件读取，量级10万～100万；采用按区域获取数据的方式优化内存，而非传统分页。

**设计说明**：
- 数据以二维矩阵结构存储，支持按行列范围查询
- 虚拟滚动仅请求当前可视区域对应的数据，而非一次性加载全量
- 区域查询结果可缓存，滚动回已访问区域时直接命中

```typescript
interface DataArea {
  startCol: number;
  endCol: number;
  startRow: number;
  endRow: number;
}

class DataManager {
  private rawData: Map<string, CellData> = new Map(); // 按坐标索引存储
  private totalCols: number;
  private totalRows: number;

  // 按区域获取数据（供虚拟滚动调用）
  getDataByArea(area: DataArea): CellData[][] {
    const result: CellData[][] = [];
    for (let row = area.startRow; row <= area.endRow; row++) {
      const rowData: CellData[] = [];
      for (let col = area.startCol; col <= area.endCol; col++) {
        const key = `${row},${col}`;
        const cell = this.rawData.get(key);
        if (cell) rowData.push(cell);
      }
      result.push(rowData);
    }
    return result;
  }

  // 获取单个格子数据
  getCell(row: number, col: number): CellData | undefined {
    return this.rawData.get(`${row},${col}`);
  }
}
```

### 2.8 事件处理性能优化（补充设计）

**澄清**：事件包含画布缩放、滚动、坐标轴更新等，优化逻辑由 AI 自主设计。

**设计方案**：

事件分为三类，采用不同优化策略：

| 事件类型 | 示例 | 频率 | 优化策略 |
|---------|------|------|---------|
| 连续触发 | wheel 滚动、mousemove 悬停 | 高频（60fps+） | RAF 调度 + 节流 |
| 离散触发 | click 选择、resize 容器变化 | 低频 | 防抖（避免重复执行） |
| 响应更新 | 坐标轴标签更新、滚动条滑块位置 | 依赖滚动 | 合并到同一 RAF 帧 |

```typescript
class EventOptimizer {
  private rafId: number | null = null;
  private pendingScroll: { deltaX: number; deltaY: number } | null = null;

  // 滚轮事件：累积增量，合并到单次 RAF 渲染
  handleWheel(e: WheelEvent): void {
    e.preventDefault();
    if (!this.pendingScroll) {
      this.pendingScroll = { deltaX: 0, deltaY: 0 };
    }
    this.pendingScroll.deltaX += e.deltaX;
    this.pendingScroll.deltaY += e.deltaY;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        if (this.pendingScroll) {
          this.scrollManager.applyScroll(this.pendingScroll.deltaX, this.pendingScroll.deltaY);
          this.pendingScroll = null;
        }
        this.rafId = null;
      });
    }
  }

  // resize 事件：防抖 150ms
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  handleResize(): void {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.recalculateLayout();
      this.renderVisibleCells();
    }, 150);
  }
}
```

### 2.9 响应式布局（已澄清，VS Code 环境）

**澄清**：VS Code 插件环境，Editor 区域可拖拽；固定图形60%、表格40%布局，图形宽度继承父容器并自适应，拖拽后动态重算可视宽高。

**设计说明**：
- 无需移动端/平板/桌面断点，运行环境固定为 VS Code 桌面端
- 布局为左右分栏：左侧 60%（BitmapGrid 图形区域），右侧 40%（DataTable 表格区域）
- 图形区域的宽高继承父容器尺寸，VS Code 面板拖拽时自动触发 resize → 重新计算可视宽高 → 重新渲染

```typescript
class BitmapTableLayout {
  private readonly GRAPH_RATIO = 0.6;  // 图形区域占比
  private readonly TABLE_RATIO = 0.4;  // 表格区域占比

  // 监听父容器尺寸变化（VS Code 面板拖拽触发）
  setupResizeObserver(container: HTMLElement): void {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.onContainerResize(width, height);
      }
    });
    observer.observe(container);
  }

  // 容器尺寸变化 → 重新计算布局
  private onContainerResize(containerWidth: number, containerHeight: number): void {
    const graphWidth = containerWidth * this.GRAPH_RATIO;
    const tableWidth = containerWidth * this.TABLE_RATIO;

    // 通知 BitmapGrid 重新计算可视宽高
    bitmapGrid.updateViewport(graphWidth, containerHeight);
    // 通知 DataTable 重新计算列宽
    dataTable.updateWidth(tableWidth);
  }
}
```

### 2.10 错误处理（暂不实现）

**澄清**：错误处理暂不考虑、暂不实现。

**备注**：后续版本可根据实际需求补充，典型场景包括数据加载失败、渲染异常、文件格式不合法等。

### 2.11 可访问性（暂不实现）

**澄清**：暂不考虑、暂不实现。

**备注**：后续版本可根据实际需求补充键盘导航、ARIA 属性、屏幕阅读器等支持。

### 2.12 国际化（暂不实现）

**澄清**：暂不考虑、暂不实现。

**备注**：后续版本可根据实际需求补充多语言支持。

### 2.13 主题切换（已澄清，实例级主题适配）

**澄清**：摒弃全局统一配置方式，不同图形实例创建时传入对应主题色参数，由各图形内部独立完成样式、配色适配，实现模块化主题适配。

**设计说明**：
- 主题不是全局单例，而是每个 BitmapGrid 实例的创建参数
- 实例创建时接收主题色参数（背景色、坐标轴色、网格线色等），内部自行适配
- 不同实例可使用不同主题，互不影响
- 主题切换时重新传入参数即可，无需全局广播

```typescript
// 实例级主题参数
interface BitmapTheme {
  backgroundColor: string;   // 画布背景色
  axisColor: string;         // 坐标轴线条+标签颜色
  gridLineColor: string;     // 网格线颜色
  scrollbarTrackColor: string; // 滚动条轨道色
  scrollbarThumbColor: string; // 滚动条滑块色
  highlightColor: string;    // 高亮框颜色
}

// 预设主题
const LIGHT_THEME: BitmapTheme = {
  backgroundColor: '#ffffff',
  axisColor: '#333333',
  gridLineColor: '#e0e0e0',
  scrollbarTrackColor: '#f0f0f0',
  scrollbarThumbColor: '#c0c0c0',
  highlightColor: '#1890ff',
};

const DARK_THEME: BitmapTheme = {
  backgroundColor: '#1e1e1e',
  axisColor: '#cccccc',
  gridLineColor: '#333333',
  scrollbarTrackColor: '#2d2d2d',
  scrollbarThumbColor: '#555555',
  highlightColor: '#177ddc',
};

// 创建实例时传入主题
const bitmap = new BitmapGrid({
  container: document.getElementById('grid'),
  theme: isDarkMode ? DARK_THEME : LIGHT_THEME,
  // ... 其他配置
});

// 主题切换：重新传入参数
bitmap.setTheme(newTheme);
```

### 2.14 数据导入（暂不实现，仅支持本地JSON）

**澄清**：数据导入相关优化暂不考虑，当前仅支持本地JSON文件读取解析，暂不开发外部数据导入及大文件解析优化功能。

**备注**：后续版本可根据需求扩展 STDF、TXT 等格式支持及 Web Worker 解析优化。

### 2.15 滚动条样式（已澄清，取消自定义）

**澄清**：取消滚动条自定义样式开发，全程采用系统默认滚动条样式展示，不进行额外样式定制与美化。

**备注**：滚动条功能（拖拽、比例计算、位置同步）仍需实现，仅样式层面不做定制。

### 2.16 坐标轴样式（已澄清，固定布局+主题色自适应）

**澄清**：坐标轴固定布局，X轴置于顶部、Y轴置于左侧；颜色跟随主题自适应，浅色主题显示黑色、深色主题显示白色，线条宽度由算法自主适配设定。

**设计说明**：
- 布局固定：X 轴在顶部（显示列号/WL），Y 轴在左侧（显示行号/BL），不支持自定义位置
- 颜色自适应：从实例主题参数 `theme.axisColor` 获取，浅色主题下为深色、深色主题下为浅色
- 线条宽度：根据格子尺寸和缩放比例自动计算，确保视觉清晰

```typescript
// 坐标轴颜色由主题参数决定
const axisColor = theme.axisColor; // 浅色: '#333333', 深色: '#cccccc'

// 线条宽度自适应：基础宽度 + 缩放补偿
const axisLineWidth = Math.max(1, Math.round(baseCellSize * 0.05));
const tickLength = Math.max(3, Math.round(baseCellSize * 0.15));
const labelFontSize = Math.max(10, Math.round(baseCellSize * 0.6));
```

### 2.17 格子交互（补充设计）

**澄清**：支持格子点击、悬停交互；点击后外部可获取格子位置信息；支持指定格子定位，目标格子不在可视区时自动滚动至可视区域并高亮展示。

**设计说明**：
- **点击**：外部通过 `onCellClick` 回调获取格子坐标和数据，用于表格联动等业务
- **悬停**：外部通过 `onCellHover` 回调获取格子信息，用于信息弹窗展示
- **定位高亮**：调用 `locateAndHighlight(col, row)` 定位到目标格子并高亮，不可见时自动滚动

```typescript
interface BitmapGridCallbacks {
  onCellClick?: (cell: { col: number; row: number; data: CellData }) => void;
  onCellHover?: (cell: { col: number; row: number; data: CellData }) => void;
}

class BitmapGrid {
  // 定位并高亮指定格子
  locateAndHighlight(col: number, row: number, highlightDuration = 2000): void {
    // 1. 确保目标格子可见（不可见则滚动）
    this.locationManager.locateToCell(col, row);
    // 2. 高亮目标格子
    this.highlightManager.highlight(col, row, highlightDuration);
  }

  // 内部事件处理 → 触发外部回调
  private handleCellClick(col: number, row: number): void {
    const data = this.dataManager.getCell(row, col);
    this.config.onCellClick?.({ col, row, data });
  }

  private handleCellHover(col: number, row: number): void {
    const data = this.dataManager.getCell(row, col);
    this.config.onCellHover?.({ col, row, data });
  }
}
```

### 2.18 缩放功能的边界（补充设计）

**澄清**：设置格子缩放的最大值、最小值及默认值，依据缩放比例进行边界校验，自动限制缩放范围，边界阈值与判定逻辑由设计自主设定。

**设计方案**：
- 格子最小尺寸（minCellSize）：低于此值无法辨识格子内容，设为 2px
- 格子最大尺寸（maxCellSize）：高于此值浪费屏幕空间且滚动范围过大，设为 50px
- 默认尺寸（defaultCellSize）：64×64 数据在默认视口内完整显示的尺寸，约 10px
- 缩放操作：以鼠标位置为中心缩放，边界校验自动钳制到合法范围

```typescript
class ZoomManager {
  readonly MIN_CELL_SIZE = 2;    // 格子最小 2px
  readonly MAX_CELL_SIZE = 50;   // 格子最大 50px
  readonly DEFAULT_CELL_SIZE = 10; // 默认 10px

  private cellSize: number = this.DEFAULT_CELL_SIZE;

  // 缩放：以当前鼠标位置为中心
  zoomAt(delta: number, anchorX: number, anchorY: number): void {
    const oldSize = this.cellSize;
    const newSize = clamp(oldSize + delta, this.MIN_CELL_SIZE, this.MAX_CELL_SIZE);
    if (newSize === oldSize) return;

    // 保持鼠标位置下的数据坐标不变，调整 scrollOffset
    const ratio = newSize / oldSize;
    this.scrollX = anchorX * ratio - (anchorX - this.scrollX) * 1; // 简化：锚点补偿
    this.scrollY = anchorY * ratio - (anchorY - this.scrollY) * 1;

    this.cellSize = newSize;
    this.applyZoom();
  }

  // 重置到默认
  resetZoom(): void {
    this.cellSize = this.DEFAULT_CELL_SIZE;
    this.scrollX = 0;
    this.scrollY = 0;
    this.applyZoom();
  }

  get zoomLevel(): number {
    return this.cellSize / this.DEFAULT_CELL_SIZE;
  }
}
```

### 2.19 选择功能的性能优化（补充设计）

**澄清**：选择功能以坐标定位为核心，依据数据位置自动跳转定位、滚动展示选中格子；针对定位渲染、滚动交互进行专项性能优化，优化策略自主决策。

**设计方案**：
- 选择操作本质是"坐标定位 + 滚动 + 高亮"，而非传统批量选择
- 性能瓶颈在定位滚动（需计算目标位置、平滑滚动、重新渲染），不在选择状态管理
- 优化要点：定位计算 O(1)、滚动动画合并到单次 RAF、高亮渲染增量更新

```typescript
class SelectionManager {
  private selectedCell: { col: number; row: number } | null = null;

  // 选择格子：定位 + 高亮，核心路径
  selectCell(col: number, row: number): void {
    const prev = this.selectedCell;
    this.selectedCell = { col, row };

    // 1. 清除旧高亮（增量更新，仅重绘旧格子区域）
    if (prev) {
      this.cellDrawer.redrawSingle(prev.col, prev.row);
    }

    // 2. 定位到目标格子（不可见时自动滚动）
    this.locationManager.locateToCell(col, row);

    // 3. 绘制新高亮（增量更新，仅重绘新格子区域）
    this.highlightDrawer.draw(col, row);

    // 4. 触发外部回调
    this.onSelect?.({ col, row, data: this.dataManager.getCell(row, col) });
  }

  // 取消选择
  clearSelection(): void {
    if (this.selectedCell) {
      this.cellDrawer.redrawSingle(this.selectedCell.col, this.selectedCell.row);
      this.selectedCell = null;
    }
  }
}
```

### 2.20 数据更新（暂不实现）

**澄清**：暂不考虑、暂不实现。

**备注**：后续版本可根据需求补充数据批量更新、增量渲染等功能。

## 三、总结

### 3.1 改进后的设计优势

✅ **坐标轴和滚动条空间布局正确**：各区域独立，统一计算位置，无冲突无重叠
✅ **滚动条和坐标轴触发逻辑分离**：横向滚动仅更新 X 轴标签，纵向滚动仅更新 Y 轴标签，滚动条滑块无需同步更新
✅ **补充了虚拟滚动和滚动条的同步机制**：提供双向同步（滚轮→滚动条、拖拽滚动条→虚拟滚动），含完整数据流
✅ **定位功能边界处理**：简单可靠，确保目标格子完整显示在可视区域内即可
✅ **颜色映射无需内置缓存**：规则由外部传入，组件内部仅按值判断色值绘制
✅ **表格-图形联动无需防抖**：仅点击触发，非高频同步
✅ **内存管理采用按区域获取数据**：适配本地文件读取，量级10万～100万
✅ **事件处理优化**：RAF 调度合并高频滚动事件 + 防抖低频 resize 事件
✅ **响应式布局明确**：VS Code 环境，固定60%/40%分栏，拖拽时 ResizeObserver 动态重算
⏭️ **错误处理暂不实现**：后续版本按需补充
⏭️ **可访问性暂不实现**：后续版本按需补充
⏭️ **国际化暂不实现**：后续版本按需补充
✅ **主题切换采用实例级主题适配**：摒弃全局配置，各图形实例创建时传入主题色参数
⏭️ **数据导入优化暂不实现**：当前仅支持本地JSON文件读取解析
✅ **滚动条样式采用系统默认**：取消自定义样式开发，功能层面仍需实现
✅ **坐标轴样式固定布局+主题自适应**：X轴顶部/Y轴左侧，颜色跟随主题，线宽算法自适应
✅ **格子交互支持点击/悬停/定位高亮**：外部回调获取位置信息，自动滚动定位并高亮
✅ **缩放边界设置最大/最小/默认值**：格子尺寸 2~50px，自动钳制，锚点缩放
✅ **选择性能以坐标定位为核心**：增量重绘高亮，定位滚动合并到单次 RAF
⏭️ **数据更新暂不实现**：后续版本按需补充

### 3.2 下一步

1. 实现改进后的设计
2. 编写单元测试
3. 性能测试和调优
4. 文档完善
