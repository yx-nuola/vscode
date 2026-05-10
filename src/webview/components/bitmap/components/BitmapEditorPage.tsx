import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BitmapCommands,
  type BitmapCell,
  type BitmapParseResponse,
  type BitmapViewportResponse,
} from '../../../../shared/bitmapProtocol';
import { useVSCode } from '../../../hooks/useVSCode';
import { BitmapGrid, type BitmapGridRef } from './BitmapGrid';
import { BitmapVirtualTable } from './BitmapVirtualTable';
import { LIGHT_THEME } from '../theme/presets';
import type { BitmapGridConfig, VisibleRange } from '../types';

export function BitmapEditorPage() {
  const { request } = useVSCode();
  const gridRef = useRef<BitmapGridRef>(null);
  const [meta, setMeta] = useState<BitmapParseResponse['meta'] | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const loadingKeyRef = useRef('');

  const showError = useCallback((error: unknown) => {
    setErrorText(error instanceof Error ? error.message : String(error));
  }, []);

  const requestViewport = useCallback(async (range: VisibleRange) => {
    const rowOverscan = 4;
    const colOverscan = 4;
    const payload = {
      startRow: Math.max(0, range.startRow - rowOverscan),
      endRow: range.endRow + rowOverscan,
      startCol: Math.max(0, range.startCol - colOverscan),
      endCol: range.endCol + colOverscan,
    };
    const key = `${payload.startRow}:${payload.endRow}:${payload.startCol}:${payload.endCol}`;
    if (loadingKeyRef.current === key) {
      return;
    }
    loadingKeyRef.current = key;

    try {
      const response = await request<BitmapViewportResponse>(BitmapCommands.REQUEST_BITMAP_VIEWPORT, payload);
      if (loadingKeyRef.current !== key) {
        return;
      }
      setErrorText(null);
      setMeta(response.meta);
      gridRef.current?.setViewportData(response.meta.rows, response.meta.cols, response.cells as BitmapCell[]);
    } catch (error) {
      showError(error);
    }
  }, [request, showError]);

  const config: BitmapGridConfig = useMemo(() => ({
    layout: {
      axisSize: 40,
      scrollbarSize: 12,
      spacing: 4,
    },
    theme: LIGHT_THEME,
    colorRules: [
      { min: 0, max: 5, color: '#ff9800' },
      { min: 5, max: 10, color: '#2196f3' },
      { min: 10, max: 100, color: '#4caf50' },
    ],
    callbacks: {
      onViewportChange: requestViewport,
    },
    initialCellSize: 10,
    minCellSize: 2,
    maxCellSize: 50,
  }), [requestViewport]);

  const loadInitial = useCallback(async () => {
    try {
      const response = await request<BitmapParseResponse>(BitmapCommands.PARSE_BITMAP_DATA);
      setErrorText(null);
      setMeta(response.meta);
      await requestViewport({
        startRow: 0,
        endRow: 64,
        startCol: 0,
        endCol: 64,
      });
    } catch (error) {
      showError(error);
    }
  }, [request, requestViewport, showError]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleTableRowClick = useCallback((_index: number, cell: BitmapCell) => {
    gridRef.current?.locateAndHighlight(cell.col, cell.row);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <div style={{ height: 34, borderBottom: '1px solid #d7dbe3', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 12, flexShrink: 0 }}>
        <strong style={{ fontSize: 13 }}>Bitmap Matrix</strong>
        {meta && (
          <span style={{ fontSize: 12, color: '#5f6673' }}>
            {meta.rows} x {meta.cols} | {meta.cellCount} cells | {meta.mode}
          </span>
        )}
        {errorText && (
          <span style={{ fontSize: 12, color: '#b42318' }}>{errorText}</span>
        )}
      </div>
      <div style={{ minHeight: 0, flex: 1, display: 'grid', gridTemplateColumns: '956px minmax(360px, 1fr)' }}>
        <BitmapGrid ref={gridRef} config={config} />
        <BitmapVirtualTable onRowClick={handleTableRowClick} />
      </div>
    </div>
  );
}
