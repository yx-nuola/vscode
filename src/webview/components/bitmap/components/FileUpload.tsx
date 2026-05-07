/**
 * 文件上传组件
 * 支持覆盖和追加模式
 */

import React, { useRef, useCallback } from 'react';
import { DataParser, ImportMode, MatrixData } from '../core/DataParser';

/**
 * 文件上传组件 Props
 */
export interface FileUploadProps {
  /** 数据加载回调 */
  onDataLoad: (data: MatrixData, mode: ImportMode) => void;
  /** 支持的文件类型 */
  accept?: string;
  /** 默认导入模式 */
  defaultMode?: ImportMode;
}

/**
 * 文件上传组件
 */
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
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
        }}
      >
        <option value="overwrite">覆盖模式</option>
        <option value="append">追加模式</option>
      </select>

      {/* 上传按钮 */}
      <button
        onClick={triggerFileSelect}
        disabled={loading}
        style={{
          padding: '6px 12px',
          backgroundColor: loading ? '#ccc' : '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
        }}
      >
        {loading ? '加载中...' : '上传文件'}
      </button>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* 错误提示 */}
      {error && (
        <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>
      )}
    </div>
  );
}
