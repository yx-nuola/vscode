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
        <Form.Item label="XAxis" className={styles.config_item}>
          <Select
            value={config.xColumn ?? '__index__'}
            options={[
              { label: 'Index', value: '__index__' },
              ...allOptions,
            ]}
            onChange={(value) => {
              updateConfig({
                xColumn: value === '__index__' ? null : String(value),
              });
            }}
          />
        </Form.Item>

        <Form.Item label="YAxis" required className={styles.config_item}>
          <Select
            allowClear
            placeholder="Please select Y axis field"
            value={config.yColumn || undefined}
            options={allOptions}
            onChange={(value) => {
              updateConfig({ yColumn: value ? String(value) : '' });
            }}
          />
        </Form.Item>

        <Form.Item label="Device" className={styles.config_item}>
          <Select
            allowClear
            placeholder="Entire file as one group"
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
            placeholder="Each group as a line"
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
            <Radio value="split">Split</Radio>
            <Radio value="merge">Merge</Radio>
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
