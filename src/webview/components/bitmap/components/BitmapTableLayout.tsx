/**
 * 60/40 左右布局
 */

import { useRef, useCallback, useState } from 'react';
import { Button, Space, Divider } from '@arco-design/web-react';
import { BitmapGrid, BitmapGridRef, BitmapGridProps } from './BitmapGrid';
import { VirtualTable, TableColumn } from './VirtualTable';
import type { CellData } from '../types';

/**
 * BitmapTableLayout 组件 Props
 */
export interface BitmapTableLayoutProps extends Omit<BitmapGridProps, 'style'> {
  /** 表格列配置 */
  tableColumns?: TableColumn[];
  /** 表格行点击回调 */
  onTableRowClick?: (row: number, cell: CellData) => void;
  /** 格子点击回调 */
  onCellClick?: (col: number, row: number) => void;
}

/**
 * BitmapTableLayout 组件
 */
export function BitmapTableLayout(props: BitmapTableLayoutProps) {
  const { tableColumns, onTableRowClick, onCellClick, ...bitmapProps } = props;

  const bitmapRef = useRef<BitmapGridRef>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | undefined>();
  const [scrollToRow, setScrollToRow] = useState<number | undefined>();

  // 默认表格列配置
  const defaultColumns: TableColumn[] = [
    { key: 'bl', title: 'BL', width: 60 },
    { key: 'wl', title: 'WL', width: 60 },
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
      setHighlightedRow(row);
      setScrollToRow(row);
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
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 左侧固定宽度 956px (896px 格子区域 + 40px Y轴 + 12px 滚动条 + 8px 间距) */}
      <div
        style={{
          width: '956px',
          height: '100%',
          borderRight: '1px solid #e0e0e0',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 工具栏 */}
        <div
          style={{
            padding: '0 8px',
            // borderBottom: '1px solid #e0e0e0',
            // backgroundColor: '#f5f5f5',
          }}
        >
          <Space style={{ display: 'flex' }}>
            <Button size="small" onClick={() => bitmapRef.current?.zoomIn()}>
              放大
            </Button>
            <Button size="small" onClick={() => bitmapRef.current?.zoomOut()}>
              缩小
            </Button>
            <Button size="small" onClick={() => bitmapRef.current?.resetZoom()}>
              还原
            </Button>
          </Space>
        </div>

        {/* BitmapGrid */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BitmapGrid
            ref={bitmapRef}
            {...bitmapProps}
            config={{
              ...bitmapProps.config,
              callbacks: {
                ...bitmapProps.config.callbacks,
                onCellClick: (cell) => handleCellClick(cell.col, cell.row),
              },
            }}
          />
        </div>
      </div>

      {/* 右侧剩余空间 DataTable */}
      <div
        style={{
          flex: 1,
          height: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
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
