import { Button, Form, Radio, Select } from '@arco-design/web-react';
import { IconPlayArrow } from '@arco-design/web-react/icon';
import type { CsvColumn, DrawMode, LineChartConfig } from '../types';
import styles from '../styles.module.scss';

interface ChartConfigPanelProps {
  tableHeader: CsvColumn[];
  config: LineChartConfig | null;
  onConfigChange: (config: LineChartConfig) => void;
  onDraw: () => void;
}

export function ChartConfigPanel({
  tableHeader,
  config,
  onConfigChange,
  onDraw,
}: ChartConfigPanelProps) {

  console.log('ChartConfigPanel render',  tableHeader,
  config,
  onConfigChange,
  onDraw,);
  if (!config) {
    return null;
  }

  const allOptions = tableHeader.map((column) => ({
    label: column.rawName,
    value: column.rawName,
  }));
  const updateConfig = (patch: Partial<LineChartConfig>): void => {
    onConfigChange({ ...config, ...patch });
  };

  return (
    <div className={styles.config_panel} >
      <Form className={styles.config_form} layout="horizontal">
        <Form.Item label="X 轴" className={styles.config_item}>
          <Select
            value={config.xColumn ?? '__index__'}
            options={[
              { label: 'Index（自动下标）', value: '__index__' },
              ...allOptions,
            ]}
            onChange={(value) => {
              updateConfig({
                xColumn: value === '__index__' ? null : String(value),
              });
            }}
          />
        </Form.Item>

        <Form.Item label="Y 轴" required className={styles.config_item}>
          <Select
            allowClear
            placeholder="请选择 Y 轴字段"
            value={config.yColumn || undefined}
            options={allOptions}
            onChange={(value) => {
              updateConfig({ yColumn: value ? String(value) : '' });
            }}
          />
        </Form.Item>

        <Form.Item label="大组" className={styles.config_item}>
          <Select
            allowClear
            placeholder="整个文件作为一组"
            value={config.deviceColumn ?? undefined}
            options={allOptions}
            disabled
            onChange={(value) => {
              updateConfig({ deviceColumn: value ? String(value) : null });
            }}
          />
        </Form.Item>

        <Form.Item label="Group" className={styles.config_item}>
          <Select
            mode="multiple"
            allowClear
            placeholder="每个大组一条线"
            value={config.groupColumns}
            options={allOptions}
            onChange={(value) => {
              updateConfig({
                groupColumns: Array.isArray(value) ? value.map(String) : [],
              });
            }}
          />
        </Form.Item>

        <Form.Item label="Draw" className={styles.config_item}>
          <Radio.Group
            type="button"
            value={config.drawMode}
            onChange={(value) => {
              updateConfig({ drawMode: value as DrawMode });
            }}
          >
            <Radio value="split">分图</Radio>
            <Radio value="merge">合并</Radio>
          </Radio.Group>
        </Form.Item>

        <div className={styles.draw_action}>
          <Button type="primary" icon={<IconPlayArrow />} onClick={onDraw}>
            Draw
          </Button>
        </div>
      </Form>
    </div>
  );
}
