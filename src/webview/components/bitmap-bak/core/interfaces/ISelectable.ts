import type { CellCoord } from './IGridRenderer';

/**
 * 格子选择接口
 * 定义格子选择功能的契约
 */

// ========== 选择配置 ==========

export interface SelectionConfig {
  /** 是否允许多选 */
  allowMultiple: boolean;
  /** 选中边框颜色 */
  selectionColor: string;
  /** 选中边框宽度（相对于格子大小的比例） */
  selectionBorderWidth: number;
  /** 是否显示选中动画 */
  showAnimation: boolean;
}

// ========== 选择事件 ==========

export interface SelectionEvent<T> {
  /** 选中的坐标 */
  coord: CellCoord;
  /** 选中的单元格数据 */
  cell: T | null;
  /** 原始鼠标事件 */
  originalEvent: MouseEvent;
}

// ========== 选择接口 ==========

export interface ISelectable<T> {
  /** 选择配置 */
  readonly selectionConfig: SelectionConfig;
  
  /** 当前选中的格子坐标 */
  readonly selectedCell: CellCoord | null;
  
  /** 选中的格子数据列表（多选时使用） */
  readonly selectedCells: CellCoord[];
  
  /**
   * 选择指定格子
   * @param row 行号
   * @param col 列号
   * @param append 是否追加到已有选择（多选）
   */
  selectCell(row: number, col: number, append?: boolean): void;
  
  /**
   * 选择多个格子
   * @param cells 坐标数组
   */
  selectCells(cells: CellCoord[]): void;
  
  /**
   * 清除选择
   */
  clearSelection(): void;
  
  /**
   * 检查格子是否被选中
   * @param row 行号
   * @param col 列号
   * @returns 是否被选中
   */
  isCellSelected(row: number, col: number): boolean;
  
  /**
   * 获取选中格子的数量
   * @returns 选中数量
   */
  getSelectionCount(): number;
  
  /**
   * 设置选择配置
   * @param config 配置对象
   */
  setSelectionConfig(config: Partial<SelectionConfig>): void;
  
  /**
   * 单元格点击回调
   * @param event 选择事件
   */
  onCellClick?(event: SelectionEvent<T>): void;
  
  /**
   * 单元格悬停回调
   * @param event 选择事件
   */
  onCellHover?(event: SelectionEvent<T>): void;
}
