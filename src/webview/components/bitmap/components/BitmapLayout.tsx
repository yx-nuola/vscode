import { useRef, useCallback, useState } from 'react';
import { Button, Space } from '@arco-design/web-react';
import { BitmapGrid, BitmapGridRef, BitmapGridProps } from './BitmapGrid';
import { ScrollToRowRequest, VirtualTable } from './VirtualTable';
import type { CellData } from '../types';

/**
 * BitmapLayout 组件 Props
 */
export interface BitmapTableLayoutProps extends Omit<BitmapGridProps, 'style'> {
  /** 表格行点击回调 */
  onTableRowClick?: (row: number, cell: CellData) => void;
  /** 格子点击回调 */
  onCellClick?: (col: number, row: number) => void;
}

/**
 * BitmapLayout 组件
 */
export function BitmapLayout(props: BitmapTableLayoutProps) {
  const { onTableRowClick, onCellClick, data, config } = props;

  const bitmapRef = useRef<BitmapGridRef>(null);
  const scrollRequestNonceRef = useRef(0);
  const [highlightedRow, setHighlightedRow] = useState<number | undefined>();
  const [scrollToRow, setScrollToRow] = useState<ScrollToRowRequest | undefined>();

  // 处理表格行点击
  const handleTableRowClick = useCallback(
    (row: number, cell: CellData) => {
      // 图形定位并高亮
      setHighlightedRow(row);
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
      if (data) {
        const rowIndex = data.cells.findIndex(
          (c: CellData) => c.row === row && c.col === col
        );
        if (rowIndex >= 0) {
          setHighlightedRow(rowIndex);
          scrollRequestNonceRef.current += 1;
          setScrollToRow({
            row: rowIndex,
            nonce: scrollRequestNonceRef.current,
          });
        } else {
          setHighlightedRow(undefined);
          setScrollToRow(undefined);
        }
      }
    },
    [onCellClick, data]
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
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <BitmapGrid
            ref={bitmapRef}
            data={data}
            config={{
              ...config,
              callbacks: {
                ...config.callbacks,
                onCellClick: (cell) => handleCellClick(cell.col, cell.row),
              },
            }}
          />
        </div>
      </div>
      <div
        style={{
          flex: 1,
          height: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        {data && (
          <VirtualTable
            data={data.cells}
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
