import type { CellData } from '../../types';

/**
 * 表格列配置
 */
export interface TableColumn {
  /** 列键 */
  key: string;
  /** 列标题 */
  title: string;
  /** 列宽度 */
  width?: number;
  /** 渲染函数 */
  render?: (value: unknown, row: CellData) => React.ReactNode;
}

/**
 * 表格组件 Props
 */
export interface VirtualTableProps {
  /** 数据 */
  data: CellData[];
  /** 行高 */
  rowHeight?: number;
  /** 容器高度 */
  height?: number | string;
  /** 行点击回调 */
  onRowClick?: (row: number, cell: CellData) => void;
  /** 高亮行索引 */
  highlightedRow?: number;
  /** 滚动到指定行 */
  scrollToRow?: ScrollToRowRequest;
}

export interface TableRecord extends Record<string, unknown> {
  __index: number;
  __cell: CellData;
}

export interface ScrollToRowRequest {
  row: number;
  nonce: number;
}
