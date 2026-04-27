/**
 * 60/40 左右布局
 */

import { useRef, useCallback } from 'react';
import { BitmapGrid, BitmapGridRef, BitmapGridProps } from './BitmapGrid';

/**
 * BitmapTableLayout 组件 Props
 */
export interface BitmapTableLayoutProps extends Omit<BitmapGridProps, 'style'> {
  /** 表格组件 */
  tableComponent: React.ReactNode;
  /** 表格行点击回调 */
  onTableRowClick?: (row: number) => void;
  /** 格子点击回调 */
  onCellClick?: (col: number, row: number) => void;
}

/**
 * BitmapTableLayout 组件
 */
export function BitmapTableLayout(props: BitmapTableLayoutProps) {
  const { tableComponent, onTableRowClick, onCellClick, ...bitmapProps } = props;

  const bitmapRef = useRef<BitmapGridRef>(null);

  // 处理表格行点击
  const handleTableRowClick = useCallback(
    (row: number) => {
      bitmapRef.current?.locateAndHighlight(0, row);
      onTableRowClick?.(row);
    },
    [onTableRowClick]
  );

  // 处理格子点击
  const handleCellClick = useCallback(
    (col: number, row: number) => {
      onCellClick?.(col, row);
      // TODO: 表格滚动定位
    },
    [onCellClick]
  );

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 左侧 60% BitmapGrid */}
      <div
        style={{
          flex: '0 0 60%',
          height: '100%',
          borderRight: '1px solid #e0e0e0',
        }}
      >
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
      <div
        style={{
          flex: '0 0 40%',
          height: '100%',
          overflow: 'auto',
        }}
      >
        {tableComponent}
      </div>
    </div>
  );
}
