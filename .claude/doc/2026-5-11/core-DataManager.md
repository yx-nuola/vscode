# core/DataManager.ts - 数据管理器

## 概述
`DataManager` 负责管理 Bitmap 网格的数据，提供数据的存储、查询和区域获取功能。

## 核心功能

### 数据存储
- 使用 Map 存储格子数据（key: `${row},${col}`）
- 维护总行数和总列数

### 数据查询
- 获取单个格子数据
- 按区域获取数据
- 获取所有格子数据

## 核心属性

```typescript
private cellMap: Map<string, CellData>;  // 格子数据映射
private totalRows: number;               // 总行数
private totalCols: number;               // 总列数
```

## 核心方法

### 数据设置

#### `setData(data: MatrixData): void`
设置数据

**流程**:
1. 清空现有数据
2. 设置行列数
3. 遍历格子数据，保存到 Map

```typescript
this.cellMap.clear();
this.totalRows = data.rows;
this.totalCols = data.cols;

for (const cell of data.cells) {
  const key = `${cell.row},${cell.col}`;
  this.cellMap.set(key, cell);
}
```

### 数据查询

#### `getCell(row: number, col: number): CellData | undefined`
获取单个格子数据

```typescript
const key = `${row},${col}`;
return this.cellMap.get(key);
```

**使用示例**:
```typescript
const cell = dataManager.getCell(10, 20);
if (cell) {
  console.log('格子值:', cell.value);
}
```

#### `getDataByArea(startRow: number, endRow: number, startCol: number, endCol: number): CellData[]`
按区域获取数据

**流程**:
1. 遍历指定区域的所有格子
2. 从 Map 获取格子数据
3. 返回数组

```typescript
const result: CellData[] = [];

for (let row = startRow; row <= endRow; row++) {
  for (let col = startCol; col <= endCol; col++) {
    const cell = this.getCell(row, col);
    if (cell) {
      result.push(cell);
    }
  }
}

return result;
```

**使用示例**:
```typescript
// 获取第 10-20 行，第 5-15 列的数据
const cells = dataManager.getDataByArea(10, 20, 5, 15);
console.log('获取到', cells.length, '个格子');
```

#### `getAllCells(): CellData[]`
获取所有格子数据

```typescript
return Array.from(this.cellMap.values());
```

### 属性访问

#### `get rows(): number`
获取总行数

```typescript
return this.totalRows;
```

#### `get cols(): number`
获取总列数

```typescript
return this.totalCols;
```

### 数据清理

#### `clear(): void`
清除数据

```typescript
this.cellMap.clear();
this.totalRows = 0;
this.totalCols = 0;
```

## 数据结构

### MatrixData 接口
```typescript
interface MatrixData {
  rows: number;      // 总行数
  cols: number;      // 总列数
  cells: CellData[]; // 格子数据数组
}
```

### CellData 接口
```typescript
interface CellData {
  row: number;       // 行号（Y 轴）
  col: number;       // 列号（X 轴）
  value: number;     // 数值（用于颜色映射）
  metadata?: {       // 元数据（可选）
    bl?: number;     // Bit Line
    wl?: number;     // Word Line
    vset?: string;   // Set 电压
    vreset?: string; // Reset 电压
    imeas?: string;  // 测量电流
    status?: string; // 状态
    [key: string]: any;
  };
}
```

## 使用示例

### 基础用法
```typescript
import { DataManager } from './core';

const dataManager = new DataManager();

// 设置数据
const matrixData = {
  rows: 100,
  cols: 128,
  cells: [
    { row: 0, col: 0, value: 100 },
    { row: 0, col: 1, value: 150 },
    // ... 更多格子
  ],
};
dataManager.setData(matrixData);

// 获取格子
const cell = dataManager.getCell(10, 20);
console.log('格子值:', cell?.value);

// 获取区域数据
const areaCells = dataManager.getDataByArea(10, 20, 5, 15);
console.log('区域格子数:', areaCells.length);
```

### 在引擎中使用
```typescript
import { BitmapGridEngine } from './core';

const engine = new BitmapGridEngine(config);

// 设置数据
engine.setData(matrixData);

// 获取格子
const cell = engine.getDataManager().getCell(10, 20);
```

## 性能特点

### 数据存储
- 使用 Map 存储格子数据，查找时间为 O(1)
- key 使用 `${row},${col}` 格式，便于快速查找

### 区域查询
- 遍历区域时只查询存在的格子
- 无数据的格子不会被包含在结果中

### 数据清理
- `clear()` 方法会清空所有数据和引用
- 适合在数据更新时重置管理器

## 注意事项

1. **数据格式**: `MatrixData` 中的 `cells` 数组顺序不影响存储
2. **重复格子**: 如果同一位置有多个格子，后设置的会覆盖先设置的
3. **无数据格子**: 调用 `getCell()` 时，如果没有数据会返回 `undefined`
4. **边界检查**: `getDataByArea()` 会自动处理超出范围的情况
