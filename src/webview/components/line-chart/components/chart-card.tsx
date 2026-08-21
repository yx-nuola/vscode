import { useMemo } from 'react';
import { Tooltip } from '@arco-design/web-react';
import type { ChartGroupData, CsvColumn, ParsedCsvRow } from '../types';
import { useLazyECharts } from '../hooks/use-lazy-echarts';
import { buildChartOption, createDisplaySeries } from '../utils/chart-option-builder';
import { EditableChartTitle } from './edit-chart-title';
import styles from '../styles.module.scss';

interface ChartCardProps {
  chartId: string;
  title: string;
  chartTitle: string;
  groups: ChartGroupData[];
  tableHeader: CsvColumn[];
  xColumn: string | null;
  yColumn: string;
  isMerged: boolean;
  polylineData: ParsedCsvRow[];
  onChartTitleChange: (chartId: string, chartTitle: string) => void;
}

export function ChartCard({
  chartId,
  title,
  chartTitle,
  groups,
  tableHeader,
  xColumn,
  yColumn,
  isMerged,
  polylineData,
  onChartTitleChange,
}: ChartCardProps) {
  const displaySeries = useMemo(() => createDisplaySeries(groups, isMerged), [groups, isMerged]);
  const option = useMemo(
    () => buildChartOption(displaySeries, tableHeader, xColumn, yColumn, polylineData, chartTitle),
    [tableHeader, displaySeries, polylineData, xColumn, yColumn, chartTitle]
  );
  const containerRef = useLazyECharts(option);

  return (
    <div className={styles.chart_card}>
      <div className={styles.chart_card_header}>
        <div className={styles.chart_card_titles}>
          <Tooltip content={title}>
            <span className={styles.chart_title_display}>{title}</span>
          </Tooltip>
          <EditableChartTitle
            title={chartTitle}
            onChange={(nextTitle) => onChartTitleChange(chartId, nextTitle)}
          />
        </div>
        <span className={styles.chart_card_meta}>{displaySeries.length} lines</span>
      </div>
      <div ref={containerRef} className={styles.chart_canvas} />
    </div>
  );
}
