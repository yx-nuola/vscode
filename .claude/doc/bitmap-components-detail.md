# Components 模块详细说明

## 概述

`components` 模块提供 React 组件，用于在 Webview 中使用 Bitmap 功能。

---

## 文件列表

| 文件 | 功能 | 状态 |
|------|------|------|
| `BitmapGrid.tsx` | 主组件，forwardRef 封装，暴露 zoomIn/zoomOut/scrollTo/selectCell 等 API | ✅ 完成 |
| `BitmapTableLayout.tsx` | 60/40 左右布局，左侧 BitmapGrid，右侧 VirtualTable，支持表格-图形联动 | ✅ 完成 |
| `BitmapTestPage.tsx` | 测试页面，包含文件上传、数据解析、可视化展示 | ✅ 完成 |
| `FileUpload.tsx` | 文件上传组件，支持覆盖/追加模式导入 JSON 数据 | ✅ 完成 |
| `VirtualTable.tsx` | 虚拟滚动表格组件，用于展示单元格数据 | ✅ 完成 |

---

## 1. BitmapGrid.tsx - 主组件

### 组件结构

```typescript
export interface BitmapGridProps extends Omit<UseBitmapGridParams, 'containerId'> {
  className?: string;
  style?: React.CSSProperties;
}

export interface BitmapGridRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  scrollTo: (scrollX: number, scrollY: number) => void;
  selectCell: (col: number, row: number) => void;
  clearSelection: () => void;
  locateAndHighlight: (col: number, row: number) => void;
  getZoomLevel: () => number;
  getScrollState: () => ScrollState;
  getSelectedCell: () => CellData | null;
}
```

### 主要功能

| 功能 | 说明 |
|------|------|
| `zoomIn()` | 放大 |
| `zoomOut()` | 缩小 |
| `resetZoom()` | 重置缩放 |
| `scrollTo(scrollX, scrollY)` | 滚动到指定位置 |
| `selectCell(col, row)` | 选择格子 |
| `clearSelection()` | 清除选择 |
| `locateAndHighlight(col, row)` | 定位并高亮格子 |
| `getZoomLevel()` | 获取缩放级别 |
| `getScrollState()` | 获取滚动状态 |
| `getSelectedCell()` | 获取选中的格子 |

### 组件实现

```typescript
export const BitmapGrid = forwardRef<BitmapGridRef, BitmapGridProps>((props, ref) => {
  const { className, style, ...hookParams } = props;

  // 1. 生成唯一容器 ID
  const containerId = `bitmap-grid-${Math.random().toString(36).substr(2, 9)}`;

  // 2. 使用 useBitmapGrid Hook
  const {
    containerRef,
    zoomIn,
    zoomOut,
    resetZoom,
    scrollTo,
    selectCell,
    clearSelection,
    locateAndHighlight,
    getZoomLevel,
    getScrollState,
    getSelectedCell,
  } = useBitmapGrid({ ...hookParams, containerId });

  // 3. 暴露 ref API
  useImperativeHandle(
    ref,
    () => ({
      zoomIn,
      zoomOut,
      resetZoom,
      scrollTo,
      selectCell,
      clearSelection,
      locateAndHighlight,
      getZoomLevel,
      getScrollState,
      getSelectedCell,
    }),
    [
      zoomIn,
      zoomOut,
      resetZoom,
      scrollTo,
      selectCell,
      clearSelection,
      locateAndHighlight,
      getZoomLevel,
      getScrollState,
      getSelectedCell,
    ]
  );

  // 4. 渲染容器
  return (
    <div
      id={containerId}
      ref={containerRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
});
```

### 使用示例

```typescript
import { BitmapGrid, BitmapGridRef } from './components/bitmap';

const MyComponent = () => {
  const gridRef = useRef<BitmapGridRef>(null);

  const handleZoomIn = () => {
    gridRef.current?.zoomIn();
  };

  return (
    <div style={{ width: 800, height: 600 }}>
      <BitmapGrid
        ref={gridRef}
        config={config}
        data={data}
        theme={theme}
        colorRules={colorRules}
        callbacks={{
          onCellClick: (cell) => console.log('Cell clicked:', cell),
          onScrollChange: (state) => console.log('Scroll changed:', state),
        }}
      />
    </div>
  );
};
```

---

## 2. BitmapTableLayout.tsx - 表格-图形联动布局

### 组件结构

```typescript
export interface BitmapTableLayoutProps extends Omit<BitmapGridProps, 'style'> {
  tableColumns?: TableColumn[];
  onTableRowClick?: (row: number, cell: CellData) => void;
  onCellClick?: (col: number, row: number) => void;
}
```

### 主要功能

| 功能 | 说明 |
|------|------|
| 左侧 60% | BitmapGrid 图形展示 |
| 右侧 40% | VirtualTable 表格展示 |
| 表格-图形联动 | 点击表格行高亮图形格子，点击图形格子高亮表格行 |

### 组件实现

```typescript
export function BitmapTableLayout(props: BitmapTableLayoutProps) {
  const { tableColumns, onTableRowClick, onCellClick, ...bitmapProps } = props;

  const bitmapRef = useRef<BitmapGridRef>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | undefined>();
  const [scrollToRow, setScrollToRow] = useState<number | undefined>();

  // 默认表格列配置
  const defaultColumns: TableColumn[] = [
    { key: 'row', title: 'BL', width: 60 },
    { key: 'col', title: 'WL', width: 60 },
    { key: 'vset', title: 'Vset', width: 80 },
    { key: 'vreset', title: 'Vreset', width: 80 },
    { key: 'imeas', title: 'Imeas', width: 80 },
    {
      key: 'status',
      title: 'Status',
      width: 80,
      render: (value) => {
        const status = String(value);
        const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'gray';
        return <span style={{ color }}>{status}</span>;
      },
    },
  ];

  const columns = tableColumns || defaultColumns;

  // 处理表格行点击
  const handleTableRowClick = useCallback(
    (row: number, cell: CellData) => {
      // 图形定位并高亮
      bitmapRef.current?.locateAndHighlight(cell.col, cell.row);
      onTableRowClick?.(row, cell);
    },
    [onTableRowClick]
  );

  // 处理格子点击
  const handleCellClick = useCallback(
    (col: number, row: number) => {
      onCellClick?.(col, row);

      // 查找对应的表格行索引
      if (bitmapProps.data) {
        const rowIndex = bitmapProps.data.cells.findIndex(
          (c) => c.row === row && c.col === col
        );
        if (rowIndex >= 0) {
          setHighlightedRow(rowIndex);
          setScrollToRow(rowIndex);
        }
      }
    },
    [onCellClick, bitmapProps.data]
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* 左侧 60% BitmapGrid */}
      <div style={{ flex: '0 0 60%', height: '100%', borderRight: '1px solid #e0e0e0' }}>
        <BitmapGrid
          ref={bitmapRef}
          {...bitmapProps}
          callbacks={{
            ...bitmapProps.callbacks,
            onCellClick: (cell) => handleCellClick(cell.col, cell.row),
          }}
        />
      </div>

      {/* 右侧 40% DataTable */}
      <div style={{ flex: '0 0 40%', height: '100%', padding: '8px', boxSizing: 'border-box' }}>
        {bitmapProps.data && (
          <VirtualTable
            data={bitmapProps.data.cells}
            columns={columns}
            height="100%"
            onRowClick={handleTableRowClick}
            highlightedRow={highlightedRow}
            scrollToRow={scrollToRow}
          />
        )}
      </div>
    </div>
  );
}
```

### 使用示例

```typescript
import { BitmapTableLayout } from './components/bitmap';

const MyComponent = () => {
  return (
    <div style={{ width: 1200, height: 800 }}>
      <BitmapTableLayout
        config={config}
        data={data}
        theme={theme}
        colorRules={colorRules}
        onTableRowClick={(row, cell) => console.log('Table row clicked:', row, cell)}
        onCellClick={(col, row) => console.log('Cell clicked:', col, row)}
      />
    </div>
  );
};
```

---

## 3. BitmapTestPage.tsx - 测试页面

### 组件结构

```typescript
export function BitmapTestPage() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [parsedData, setParsedData] = useState<MatrixData | null>(null);
  const [colorRules, setColorRules] = useState<ColorRule[]>([
    { min: 0, max: 5, color: '#ff9800' },
    { min: 5, max: 10, color: '#2196f3' },
    { min: 10, max: 100, color: '#4caf50' },
  ]);
}
```

### 主要功能

| 功能 | 说明 |
|------|------|
| 文件上传 | 支持覆盖/追加模式导入 JSON 数据 |
| 数据解析 | 解析 RRAM 测试数据 |
| 数据统计 | 显示总行数、总列数、总单元数 |
| 可视化展示 | 使用 BitmapTableLayout 展示数据 |

### 组件实现

```typescript
export function BitmapTestPage() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [parsedData, setParsedData] = useState<MatrixData | null>(null);
  const [colorRules, setColorRules] = useState<ColorRule[]>([
    { min: 0, max: 5, color: '#ff9800' },
    { min: 5, max: 10, color: '#2196f3' },
    { min: 10, max: 100, color: '#4caf50' },
  ]);

  // 使用 useMemo 确保 config 对象在 colorRules 变化时重新创建
  const config: BitmapGridConfig = useMemo(() => ({
    layout: {
      toolbarHeight: 40,
      axisSize: 40,
      scrollbarSize: 12,
      spacing: 4,
    },
    theme: LIGHT_THEME,
    colorRules,
    initialCellSize: 10,
    minCellSize: 2,
    maxCellSize: 50,
  }), [colorRules]);

  // 处理数据加载
  const handleDataLoad = useCallback(
    (newData: MatrixData, mode: ImportMode) => {
      if (mode === 'overwrite' || !data) {
        setData(newData);
      } else {
        // 追加模式：合并数据
        const mergedData = DataParser.mergeData(data, newData);
        setData(mergedData);
      }
    },
    [data]
  );

  // 处理解析
  const handleParse = useCallback(() => {
    if (data) {
      setParsedData(data);
    }
  }, [data]);

  // 处理格子点击
  const handleCellClick = useCallback((col: number, row: number) => {
    console.log('Cell clicked:', { col, row });
  }, []);

  // 处理表格行点击
  const handleTableRowClick = useCallback((row: number, cell: any) => {
    console.log('Table row clicked:', { row, cell });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部工具栏 */}
      <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '16px' }}>RRAM 测试结果可视化</h2>

        {/* 文件上传 */}
        <FileUpload onDataLoad={handleDataLoad} />

        {/* 解析按钮 */}
        {data && !parsedData && (
          <button onClick={handleParse} style={{ padding: '6px 12px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
            解析数据
          </button>
        )}

        {/* 数据统计 */}
        {data && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            <span>总行数: {data.rows}</span>
            <span style={{ marginLeft: '8px' }}>总列数: {data.cols}</span>
            <span style={{ marginLeft: '8px' }}>总单元数: {data.cells.length}</span>
          </div>
        )}
      </div>

      {/* 主内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {parsedData ? (
          <BitmapTableLayout
            config={config}
            data={parsedData}
            onCellClick={handleCellClick}
            onTableRowClick={handleTableRowClick}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '14px' }}>
            {data ? '请点击"解析数据"按钮开始可视化' : '请上传 JSON 格式的测试数据文件'}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 4. FileUpload.tsx - 文件上传组件

### 组件结构

```typescript
export interface FileUploadProps {
  onDataLoad: (data: MatrixData, mode: ImportMode) => void;
  accept?: string;
  defaultMode?: ImportMode;
}
```

### 主要功能

| 功能 | 说明 |
|------|------|
| 导入模式选择 | 覆盖模式 / 追加模式 |
| 文件上传 | 支持 JSON 格式文件 |
| 数据验证 | 验证数据格式 |
| 错误处理 | 显示错误信息 |

### 组件实现

```typescript
export function FileUpload({
  onDataLoad,
  accept = '.json',
  defaultMode = 'overwrite',
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = React.useState<ImportMode>(defaultMode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 处理文件选择
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setLoading(true);
      setError(null);

      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        // 验证数据格式
        if (!DataParser.validateData(jsonData)) {
          throw new Error('Invalid data format');
        }

        // 解析数据
        const matrixData = DataParser.parseRRAMData(jsonData);

        // 回调加载数据
        onDataLoad(matrixData, importMode);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
        // 清空文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [importMode, onDataLoad]
  );

  // 触发文件选择
  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* 导入模式选择 */}
      <select
        value={importMode}
        onChange={(e) => setImportMode(e.target.value as ImportMode)}
        style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
      >
        <option value="overwrite">覆盖模式</option>
        <option value="append">追加模式</option>
      </select>

      {/* 上传按钮 */}
      <button
        onClick={triggerFileSelect}
        disabled={loading}
        style={{ padding: '6px 12px', backgroundColor: loading ? '#ccc' : '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px' }}
      >
        {loading ? '加载中...' : '上传文件'}
      </button>

      {/* 隐藏的文件输入 */}
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* 错误提示 */}
      {error && <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
    </div>
  );
}
```

### 使用示例

```typescript
import { FileUpload } from './components/bitmap';

const MyComponent = () => {
  const handleDataLoad = (data: MatrixData, mode: ImportMode) => {
    console.log('Data loaded:', data, mode);
    setData(data);
  };

  return (
    <FileUpload
      onDataLoad={handleDataLoad}
      accept=".json"
      defaultMode="overwrite"
    />
  );
};
```

---

## 5. VirtualTable.tsx - 虚拟滚动表格

### 组件结构

```typescript
export interface VirtualTableProps {
  data: CellData[];
  columns: TableColumn[];
  height: string | number;
  onRowClick?: (row: number, cell: CellData) => void;
  highlightedRow?: number;
  scrollToRow?: number;
}

export interface TableColumn {
  key: string;
  title: string;
  width: number;
  render?: (value: any) => React.ReactNode;
}
```

### 主要功能

| 功能 | 说明 |
|------|------|
| 虚拟滚动 | 只渲染可见行，支持大数据量 |
| 行高亮 | 高亮指定行 |
| 滚动定位 | 滚动到指定行 |
| 自定义渲染 | 支持自定义列渲染 |

### 组件实现

```typescript
export function VirtualTable({
  data,
  columns,
  height,
  onRowClick,
  highlightedRow,
  scrollToRow,
}: VirtualTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowHeight = 30; // 行高
  const visibleRows = Math.ceil(Number(height) / rowHeight) + 2; // 可见行数 + 缓冲

  // 滚动到指定行
  useEffect(() => {
    if (scrollToRow !== undefined && containerRef.current) {
      const targetScrollTop = scrollToRow * rowHeight;
      containerRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollToRow]);

  // 计算可见行
  const startRow = Math.floor(scrollTop / rowHeight);
  const endRow = Math.min(startRow + visibleRows, data.length);
  const visibleData = data.slice(startRow, endRow);

  return (
    <div
      ref={containerRef}
      style={{ height, overflow: 'auto', border: '1px solid #e0e0e0' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* 表头 */}
      <div style={{ display: 'flex', position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>
        {columns.map((col) => (
          <div key={col.key} style={{ width: col.width, padding: '8px', borderRight: '1px solid #e0e0e0', fontWeight: 'bold' }}>
            {col.title}
          </div>
        ))}
      </div>

      {/* 表格内容 */}
      <div style={{ position: 'relative', height: `${data.length * rowHeight}px` }}>
        {visibleData.map((cell, index) => {
          const rowIndex = startRow + index;
          return (
            <div
              key={rowIndex}
              style={{
                position: 'absolute',
                top: `${rowIndex * rowHeight}px`,
                left: 0,
                right: 0,
                height: rowHeight,
                display: 'flex',
                backgroundColor: highlightedRow === rowIndex ? '#e6f7ff' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => onRowClick?.(rowIndex, cell)}
            >
              {columns.map((col) => (
                <div key={col.key} style={{ width: col.width, padding: '8px', borderRight: '1px solid #e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {col.render ? col.render(cell[col.key as keyof CellData]) : String(cell[col.key as keyof CellData])}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 使用示例

```typescript
import { VirtualTable } from './components/bitmap';

const MyComponent = () => {
  const columns: TableColumn[] = [
    { key: 'row', title: 'BL', width: 60 },
    { key: 'col', title: 'WL', width: 60 },
    { key: 'imeas', title: 'Imeas', width: 80 },
    {
      key: 'status',
      title: 'Status',
      width: 80,
      render: (value) => {
        const status = String(value);
        const color = status === 'pass' ? 'green' : 'red';
        return <span style={{ color }}>{status}</span>;
      },
    },
  ];

  return (
    <VirtualTable
      data={data.cells}
      columns={columns}
      height="100%"
      onRowClick={(row, cell) => console.log('Row clicked:', row, cell)}
      highlightedRow={highlightedRow}
      scrollToRow={scrollToRow}
    />
  );
};
```

---

## Components 模块设计模式

### 1. forwardRef 模式

`BitmapGrid` 使用 `forwardRef` 暴露 API：

```typescript
export const BitmapGrid = forwardRef<BitmapGridRef, BitmapGridProps>((props, ref) => {
  // ...
  useImperativeHandle(ref, () => ({ /* API */ }), [/* 依赖 */]);
});
```

### 2. Hook 模式

使用 `useBitmapGrid` Hook 管理引擎生命周期：

```typescript
const { zoomIn, zoomOut, /* ... */ } = useBitmapGrid({ containerId, config, data, theme, colorRules });
```

### 3. 联动模式

`BitmapTableLayout` 实现表格-图形联动：

```typescript
// 表格行点击 → 图形定位并高亮
const handleTableRowClick = (row: number, cell: CellData) => {
  bitmapRef.current?.locateAndHighlight(cell.col, cell.row);
};

// 图形格子点击 → 表格高亮并滚动
const handleCellClick = (col: number, row: number) => {
  const rowIndex = data.cells.findIndex((c) => c.row === row && c.col === col);
  setHighlightedRow(rowIndex);
  setScrollToRow(rowIndex);
};
```

### 4. 虚拟滚动模式

`VirtualTable` 使用虚拟滚动优化性能：

```typescript
// 只渲染可见行
const startRow = Math.floor(scrollTop / rowHeight);
const endRow = Math.min(startRow + visibleRows, data.length);
const visibleData = data.slice(startRow, endRow);
```

---

## 与其他模块的关系

```
React 组件 (components/) ←─── 本模块
    ↓ 使用
useBitmapGrid Hook (hooks/)
    ↓ 创建
BitmapGridEngine (core/)
    ↓ 创建
Layers (layers/)
    ↓ 使用
Draws (draws/)
    ↓ 绘制到
Konva Canvas
```

### 调用链

1. React 组件通过 `useBitmapGrid` Hook 创建 `BitmapGridEngine`
2. `BitmapGridEngine` 初始化时创建各核心模块和图层
3. 图层监听 EventBus 事件
4. 事件触发时调用 Draw 类的渲染方法
5. Draw 类从 Engine 获取配置、数据、状态
6. Draw 类创建/更新 Konva 图形对象
7. React 组件通过 ref API 调用 Engine 的方法

---

## 组件使用场景

| 组件 | 使用场景 |
|------|---------|
| `BitmapGrid` | 基础图形展示，需要通过 ref 控制缩放、滚动、选择 |
| `BitmapTableLayout` | 需要同时展示图形和表格，支持联动 |
| `BitmapTestPage` | 测试和演示，包含完整的文件上传、解析、可视化流程 |
| `FileUpload` | 需要上传 JSON 数据文件 |
| `VirtualTable` | 需要展示大量数据，使用虚拟滚动优化性能 |
