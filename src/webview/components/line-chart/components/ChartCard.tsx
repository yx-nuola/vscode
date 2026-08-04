import { useMemo } from 'react';
import type { ChartGroupData, CsvColumn } from '../types';
import { useLazyECharts } from '../hooks/useLazyECharts';
import {
  buildChartOption,
  createDisplaySeries,
} from '../utils/chart-option-builder';
import { EditableChartTitle } from './EditableChartTitle';
import styles from '../styles.module.scss';

interface ChartCardProps {
  chartId: string;
  title: string;
  groups: ChartGroupData[];
  columns: CsvColumn[];
  xColumn: string | null;
  yColumn: string;
  isMerged: boolean;
  onTitleChange: (chartId: string, title: string) => void;
}

export function ChartCard({
  chartId,
  title,
  groups,
  columns,
  xColumn,
  yColumn,
  isMerged,
  onTitleChange,
}: ChartCardProps) {
  const displaySeries = useMemo(
    () => createDisplaySeries(groups, isMerged),
    [groups, isMerged],
  );
  const option = useMemo(
    () => buildChartOption(displaySeries, columns, xColumn, yColumn),
    [columns, displaySeries, xColumn, yColumn],
  );
  const containerRef = useLazyECharts(option);

  return (
    <article className={styles.chart_card}>
      <header className={styles.chart_card_header}>
        <EditableChartTitle
          title={title}
          onChange={(nextTitle) => onTitleChange(chartId, nextTitle)}
        />
        <span className={styles.chart_card_meta}>
          {displaySeries.length} 条曲线
        </span>
      </header>
      <div ref={containerRef} className={styles.chart_canvas} />
    </article>
  );
}
