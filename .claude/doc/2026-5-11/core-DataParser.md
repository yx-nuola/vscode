# core/DataParser.ts - 数据解析器

## 概述
`DataParser` 负责解析 RRAM 测试数据，将 JSON 格式的测试数据转换为 Bitmap 网格可用的 `MatrixData` 格式。

## 核心功能

### 数据解析
- 解析 RRAM 测试数据
- 转换坐标轴（bl → row, wl → col）
- 提取颜色映射值（imeas）

### 数据合并
- 追加模式合并数据（覆盖重复的）

### 数据验证
- 验证数据格式

### JSON 解析
- 解析 JSON 字符串

## 核心方法

### 解析 RRAM 数据

#### `parseRRAMData(data: DataType): MatrixData`
解析 RRAM 测试数据

**转换规则**:
- `cell.bl` → `row`（Y 轴）
- `cell.wl` → `col`（X 轴）
- `cell.imeas` → `value`（颜色映射值）

**流程**:
1. 遍历所有格子
2. 转换坐标和值
3. 保存元数据
4. 返回 `MatrixData`

```typescript
const cells: CellData[] = data.cells.map((cell) => ({
  row: cell.bl,      // bl → row（Y 轴）
  col: cell.wl,      // wl → col（X 轴）
  value: parseFloat(String(cell.imeas)),  // 使用 imeas 作为颜色映射值
  metadata: {
    wl: cell.wl,
    bl: cell.bl,
    vset: String(cell.vset),
    vreset: String(cell.vreset),
    imeas: String(cell.imeas),
    status: cell.status,
  },
}));

return {
  rows: data.rows,
  cols: data.cols,
  cells,
};
```

**使用示例**:
```typescript
const rramData = {
  rows: 100,
  cols: 128,
  metadata: {
    // 元数据
  },
  cells: [
    {
      wl: 0,
      bl: 0,
      vset: 1.5,
      vreset: -1.2,
      imeas: 0.05,
      status: 'success',
    },
    // ... 更多格子
  ],
};

const matrixData = DataParser.parseRRAMData(rramData);
// matrixData.cells[0] = { row: 0, col: 0, value: 0.05, metadata: {...} }
```

### 合并数据

#### `mergeData(existingData: MatrixData, newData: MatrixData): MatrixData`
合并数据（追加模式）

**流程**:
1. 创建新的 Map
2. 添加现有数据
3. 添加新数据（覆盖重复的）
4. 计算新的行列数（最大值 + 1）
5. 返回合并后的数据

```typescript
const cellMap = new Map<string, CellData>();

// 添加现有数据
for (const cell of existingData.cells) {
  const key = `${cell.row},${cell.col}`;
  cellMap.set(key, cell);
}

// 添加新数据（覆盖重复的）
for (const cell of newData.cells) {
  const key = `${cell.row},${cell.col}`;
  cellMap.set(key, cell);
}

// 计算新的行列数
const maxRow = Math.max(
  existingData.rows,
  ...newData.cells.map((c) => c.row)
);
const maxCol = Math.max(
  existingData.cols,
  ...newData.cells.map((c) => c.col)
);

return {
  rows: maxRow + 1,
  cols: maxCol + 1,
  cells: Array.from(cellMap.values()),
};
```

**使用示例**:
```typescript
const data1 = {
  rows: 100,
  cols: 128,
  cells: [{ row: 0, col: 0, value: 100 }],
};

const data2 = {
  rows: 200,
  cols: 256,
  cells: [{ row: 100, col: 0, value: 200 }],
};

const merged = DataParser.mergeData(data1, data2);
console.log(merged.rows);  // 201
console.log(merged.cols);  // 257
```

### JSON 解析

#### `parseJSON(jsonString: string): MatrixData`
解析 JSON 字符串

**流程**:
1. 尝试解析 JSON 字符串
2. 调用 `parseRRAMData` 解析数据
3. 返回 `MatrixData`

```typescript
try {
  const data = JSON.parse(jsonString) as DataType;
  return this.parseRRAMData(data);
} catch (error) {
  throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
}
```

**使用示例**:
```typescript
const jsonString = `{
  "rows": 100,
  "cols": 128,
  "cells": [
    { "wl": 0, "bl": 0, "vset": 1.5, "vreset": -1.2, "imeas": 0.05, "status": "success" }
  ]
}`;

const matrixData = DataParser.parseJSON(jsonString);
```

### 数据验证

#### `validateData(data: unknown): data is DataType`
验证数据格式

**验证规则**:
- 必须是对象类型
- 包含 `rows` 和 `cols`（数字类型）
- 包含 `cells` 数组
- 每个 cell 必须包含:
  - `wl`（数字）
  - `bl`（数字）
  - `vset`（字符串或数字）
  - `vreset`（字符串或数字）
  - `imeas`（字符串或数字）
  - `status`（字符串）

```typescript
return (
  typeof rramData.rows === 'number' &&
  typeof rramData.cols === 'number' &&
  typeof rramData.metadata === 'object' &&
  Array.isArray(rramData.cells) &&
  rramData.cells.every(
    (cell) =>
      typeof cell.wl === 'number' &&
      typeof cell.bl === 'number' &&
      (typeof cell.vset === 'string' || typeof cell.vset === 'number') &&
      (typeof cell.vreset === 'string' || typeof cell.vreset === 'number') &&
      (typeof cell.imeas === 'string' || typeof cell.imeas === 'number') &&
      typeof cell.status === 'string'
  )
);
```

**使用示例**:
```typescript
const data = {
  rows: 100,
  cols: 128,
  cells: [
    { wl: 0, bl: 0, vset: 1.5, vreset: -1.2, imeas: 0.05, status: 'success' }
  ],
};

if (DataParser.validateData(data)) {
  const matrixData = DataParser.parseRRAMData(data);
  console.log('数据格式正确');
} else {
  console.log('数据格式错误');
}
```

## 数据类型

### DataType 接口
```typescript
interface DataType {
  rows: number;             // 总行数
  cols: number;             // 总列数
  metadata?: {              // 元数据（可选）
    [key: string]: any;
  };
  cells: Array<{
    wl: number;             // Bit Line（列）
    bl: number;             // Word Line（行）
    vset: string | number;  // Set 电压
    vreset: string | number;// Reset 电压
    imeas: string | number; // 测量电流
    status: string;         // 状态
    [key: string]: any;     // 其他字段
  }>;
}
```

## 使用示例

### 完整流程
```typescript
import { DataParser } from './core';

// 1. 从文件读取 JSON
const jsonString = `...`;

// 2. 解析 JSON
const matrixData = DataParser.parseJSON(jsonString);

// 3. 验证数据
if (DataParser.validateData(matrixData)) {
  console.log('数据格式正确');
} else {
  console.log('数据格式错误');
}

// 4. 合并数据（可选）
const existingData = { rows: 100, cols: 128, cells: [] };
const mergedData = DataParser.mergeData(existingData, matrixData);

// 5. 使用数据
const engine = new BitmapGridEngine(config);
engine.setData(mergedData);
```

### 在引擎中使用
```typescript
import { BitmapGridEngine } from './core';

// 读取文件
const response = await fetch('path/to/data.json');
const jsonString = await response.text();

// 解析数据
const matrixData = DataParser.parseJSON(jsonString);

// 设置到引擎
const engine = new BitmapGridEngine(config);
engine.setData(matrixData);
```

## 注意事项

1. **坐标转换**: `bl` 对应 Y 轴（行），`wl` 对应 X 轴（列）
2. **数值类型**: `imeas` 会转换为 `number` 类型
3. **元数据**: 所有元数据都会被保留
4. **数据合并**: 重复的格子会被覆盖
5. **JSON 解析**: 解析失败会抛出错误
