import { useMemo } from 'react';
import type { ChartGroupData, CsvColumn, ParsedCsvRow } from '../types';
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
  tableHeader: CsvColumn[];
  xColumn: string | null;
  yColumn: string;
  isMerged: boolean;
  polylineData: ParsedCsvRow[];
  onTitleChange: (chartId: string, title: string) => void;
}

export function ChartCard({
  chartId,
  title,
  groups,
  tableHeader,
  xColumn,
  yColumn,
  isMerged,
  polylineData,
  onTitleChange,
}: ChartCardProps) {
  const displaySeries = useMemo(
    () => createDisplaySeries(groups, isMerged),
    [groups, isMerged],
  );
  const option = useMemo(
    () => buildChartOption(displaySeries, tableHeader, xColumn, yColumn, polylineData),
    [tableHeader, displaySeries, polylineData, xColumn, yColumn],
  );
  const containerRef = useLazyECharts(option);

  return (
    <div className={styles.chart_card}>
      <div className={styles.chart_card_header}>
        <EditableChartTitle
          title={title}
          onChange={(nextTitle) => onTitleChange(chartId, nextTitle)}
        />
        <span className={styles.chart_card_meta}>
          {displaySeries.length} 条折线
        </span>
      </div>
      <div ref={containerRef} className={styles.chart_canvas} />
    </div>
  );
}
