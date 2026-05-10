import { useCallback, useEffect, useState } from 'react';
import { Button, Radio, Space, Typography } from '@arco-design/web-react';
import {
  BitmapCommands,
  type BitmapImportMode,
  type BitmapParseResponse,
  type BitmapUploadedFile,
} from '../../../../shared/bitmapProtocol';
import { useVSCode } from '../../../hooks/useVSCode';

const { Text } = Typography;

export function BitmapActivityPanel() {
  const { request } = useVSCode();
  const [files, setFiles] = useState<BitmapUploadedFile[]>([]);
  const [mode, setMode] = useState<BitmapImportMode>('overwrite');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showError = useCallback((error: unknown) => {
    setNotice({ type: 'error', text: error instanceof Error ? error.message : String(error) });
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      const list = await request<BitmapUploadedFile[]>(BitmapCommands.LIST_BITMAP_FILES);
      setFiles(list);
    } catch (error) {
      showError(error);
    }
  }, [request, showError]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const upload = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const list = await request<BitmapUploadedFile[]>(BitmapCommands.UPLOAD_BITMAP_FILES);
      setFiles(list);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [request, showError]);

  const parse = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const result = await request<BitmapParseResponse>(BitmapCommands.PARSE_BITMAP_DATA, { mode });
      setNotice({ type: 'success', text: `解析完成: ${result.meta.rows} x ${result.meta.cols}` });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [mode, request, showError]);

  const openEditor = useCallback(async () => {
    setNotice(null);
    try {
      await request(BitmapCommands.OPEN_BITMAP_EDITOR);
    } catch (error) {
      showError(error);
    }
  }, [request, showError]);

  return (
    <div style={{ padding: 12, height: '100vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button type="primary" long loading={loading} onClick={upload}>
          上传 JSON
        </Button>
        <Radio.Group value={mode} type="button" onChange={(value) => setMode(value as BitmapImportMode)}>
          <Radio value="overwrite">覆盖</Radio>
          <Radio value="append">追加</Radio>
        </Radio.Group>
        <Button long disabled={files.length === 0 || loading} onClick={parse}>
          解析并打开
        </Button>
        <Button long disabled={loading} onClick={openEditor}>
          打开矩阵
        </Button>
        {notice && (
          <div
            style={{
              padding: '6px 8px',
              borderRadius: 4,
              fontSize: 12,
              color: notice.type === 'error' ? '#b42318' : '#067647',
              background: notice.type === 'error' ? '#fff1f0' : '#ecfdf3',
              border: `1px solid ${notice.type === 'error' ? '#ffccc7' : '#abefc6'}`,
            }}
          >
            {notice.text}
          </div>
        )}
      </Space>

      <div style={{ borderTop: '1px solid var(--color-border-2)', paddingTop: 10, minHeight: 0, flex: 1 }}>
        <Text bold>上传列表</Text>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', height: 'calc(100% - 24px)' }}>
          {files.length === 0 ? (
            <Text type="secondary">暂无文件</Text>
          ) : (
            files.map((file) => (
              <div key={file.id} style={{ border: '1px solid var(--color-border-2)', borderRadius: 6, padding: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
