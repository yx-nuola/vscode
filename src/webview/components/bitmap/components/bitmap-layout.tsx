import { useRef, useCallback, useEffect, useState } from 'react';
import { Button, } from '@arco-design/web-react';
import { IconFullscreenExit, IconPlusCircle, IconMinusCircle } from '@arco-design/web-react/icon';
import { BitmapGrid, BitmapGridRef, BitmapGridProps } from './bitmap-grid';
import {  VirtualTable } from './virtual-table';
import type { ScrollToRowRequest } from './virtual-table/types';
import type { CellData } from '../types';
import {
  BITMAP_WIDTH,
  DEFAULT_COLS,
  DEFAULT_ROWS,
} from '../constants';

const { Group: ButtonGroup } = Button
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
  const dataRows = data?.rows ?? DEFAULT_ROWS;
  const dataCols = data?.cols ?? DEFAULT_COLS;
  const bitmapWidth =
    config.layout.axisSize +
    config.layout.spacing +
    BITMAP_WIDTH +
    config.layout.spacing +
    config.layout.scrollbarSize;

    console.log('bitmapWidth', config,BITMAP_WIDTH, bitmapWidth);  
  const axisW =  dataCols <= DEFAULT_COLS;
  const axisH = dataRows <= DEFAULT_ROWS;

  useEffect(() => {
    // 数据更新清除之前的高亮和选中
    setHighlightedRow(undefined);
    setScrollToRow(undefined);
    bitmapRef.current?.clearSelection();
  }, [data]);

  // 同步右侧表格的高亮行与滚动位置（点击格子和键盘移动共用）
  const syncTableSelection = useCallback(
    (cell: CellData | null) => {
      if (!data || !cell) {
        setHighlightedRow(undefined);
        setScrollToRow(undefined);
        return;
      }

      const rowIndex = data.cells.findIndex(
        (c: CellData) => c.row === cell.row && c.col === cell.col
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
    },
    [data]
  );

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

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
      }}
    >
      {/* 小数据保持理想尺寸，大数据与右侧表格共同使用可视区宽度 */}
      <div
        style={{
          width: axisW ? `${bitmapWidth}px` : undefined,
          height: '100%',
          flex: `0 7 min(${bitmapWidth}px, 100%)`,
          minWidth: 400,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 工具栏 */}
        <div
          style={{
            padding: '0 8px',
          }}
        >
          <ButtonGroup>
            <Button  onClick={() => bitmapRef.current?.zoomIn()}icon={<IconMinusCircle  style={{ fontSize: '16px' }}/>} />
            <Button  onClick={() => bitmapRef.current?.zoomOut()}icon={<IconPlusCircle  style={{ fontSize: '16px' }}/>} />
          <Button  onClick={() => bitmapRef.current?.resetZoom()}icon={<IconFullscreenExit  style={{ fontSize: '16px' }}/>} />
        </ButtonGroup>
        </div>
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            width: '100%',
            maxHeight: axisH ? `${bitmapWidth}px` : undefined,
            overflow: 'hidden',
          }}
        >
          <BitmapGrid
            ref={bitmapRef}
            data={data}
            config={{
              ...config,
              callbacks: {
                ...config.callbacks,
                onSelectionChange: (cell) => syncTableSelection(cell),
              },
            }}
          />
        </div>
      </div>
      <div
        style={{
          flex: '1 3 0',
          // width: `calc(100% - ${bitmapWidth}px)`,
          minWidth: 200,
          height: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          // overflow: 'auto',
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
