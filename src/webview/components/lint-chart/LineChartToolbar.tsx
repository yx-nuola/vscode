import { useRef } from 'react';
import {
  Button,
  Radio,
  Select,
  Space,
} from '@arco-design/web-react';
import { IconFile, IconRefresh } from '@arco-design/web-react/icon';
import type {
  CsvColumn,
  DrawMode,
  LineChartFeedback,
  LineChartConfig,
} from './types';

interface LineChartToolbarProps {
  columns: CsvColumn[];
  config: LineChartConfig | null;
  fileName: string | null;
  rowCount: number;
  isLoading: boolean;
  feedback: LineChartFeedback | null;
  onFileSelect: (file: File) => void;
  onConfigChange: (config: LineChartConfig) => void;
  onDraw: () => void;
}

export function LineChartToolbar({
  columns,
  config,
  fileName,
  rowCount,
  isLoading,
  feedback,
  onFileSelect,
  onConfigChange,
  onDraw,
}: LineChartToolbarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const allOptions = columns.map(toSelectOption);

  const updateConfig = (patch: Partial<LineChartConfig>): void => {
    if (config) {
      onConfigChange({ ...config, ...patch });
    }
  };

  return (
    <header className="line-chart-toolbar">
      <div className="line-chart-toolbar__file-row">
        <input
          ref={inputRef}
          className="line-chart-toolbar__file-input"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onFileSelect(file);
            }
            event.target.value = '';
          }}
        />
        <Button
          type="primary"
          icon={<IconFile />}
          loading={isLoading}
          onClick={() => inputRef.current?.click()}
        >
          上传 CSV
        </Button>
        <div className="line-chart-toolbar__file-meta">
          <strong>{fileName ?? '尚未选择文件'}</strong>
          {fileName && <span>{rowCount} 行数据</span>}
        </div>
      </div>

      {feedback && (
        <div
          className={`line-chart-toolbar__feedback line-chart-toolbar__feedback--${feedback.tone}`}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      {config && (
        <div className="line-chart-toolbar__config-row">
          <ConfigField label="X 轴">
            <Select
              value={config.xColumn ?? '__index__'}
              options={[
                { label: 'Index（自动下标）', value: '__index__' },
                ...allOptions,
              ]}
              onChange={(value) =>
                updateConfig({
                  xColumn: value === '__index__' ? null : String(value),
                })
              }
            />
          </ConfigField>

          <ConfigField label="Y 轴" required>
            <Select
              allowClear
              placeholder="请选择 Y 轴字段"
              value={config.yColumn || undefined}
              options={allOptions}
              onChange={(value) =>
                updateConfig({ yColumn: value ? String(value) : '' })
              }
            />
          </ConfigField>

          <ConfigField label="大组">
            <Select
              allowClear
              placeholder="整个文件作为一组"
              value={config.deviceColumn ?? undefined}
              options={allOptions}
              onChange={(value) =>
                updateConfig({ deviceColumn: value ? String(value) : null })
              }
            />
          </ConfigField>

          <ConfigField label="Group">
            <Select
              mode="multiple"
              allowClear
              placeholder="每个大组一条线"
              value={config.groupColumns}
              options={allOptions}
              onChange={(value) =>
                updateConfig({
                  groupColumns: Array.isArray(value)
                    ? value.map(String)
                    : [],
                })
              }
            />
          </ConfigField>

          <ConfigField label="Draw">
            <Radio.Group
              type="button"
              value={config.drawMode}
              onChange={(value) =>
                updateConfig({ drawMode: value as DrawMode })
              }
            >
              <Radio value="split">分图</Radio>
              <Radio value="merge">合并</Radio>
            </Radio.Group>
          </ConfigField>

          <Space className="line-chart-toolbar__draw-action">
            <Button
              type="primary"
              icon={<IconRefresh />}
              onClick={onDraw}
            >
              Draw
            </Button>
          </Space>
        </div>
      )}
    </header>
  );
}

interface ConfigFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function ConfigField({ label, required, children }: ConfigFieldProps) {
  return (
    <div className="line-chart-toolbar__field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      {children}
    </div>
  );
}

function toSelectOption(column: CsvColumn): {
  label: string;
  value: string;
} {
  return {
    label: column.rawName,
    value: column.rawName,
  };
}
