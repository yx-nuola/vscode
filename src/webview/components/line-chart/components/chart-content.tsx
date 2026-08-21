import { Alert, Empty } from '@arco-design/web-react';
import type { BuildChartResult, CsvColumn, LineChartConfig, ParsedCsvRow } from '../types';
import { ChartCard } from './chart-card';
import styles from '../styles.module.scss';

interface ChartContentProps {
  result: BuildChartResult | null;
  tableHeader: CsvColumn[];
  config: LineChartConfig | null;
  fileName: string | null;
  chartTitles: Record<string, string>;
  polylineData: ParsedCsvRow[];
  onChartTitleChange: (chartId: string, chartTitle: string) => void;
}

export function ChartContent({
  result,
  tableHeader,
  config,
  fileName,
  chartTitles,
  polylineData,
  onChartTitleChange,
}: ChartContentProps) {
  if (!result || !config) {
    return (
      <main className={`${styles.chart_content} ${styles.empty_content}`}>
        <Empty
          description={
            fileName
              ? 'Configure the chart and click Draw to render'
              : 'Upload a CSV file to start building line charts'
          }
        />
      </main>
    );
  }

  if (result.groups.length === 0) {
    return (
      <main className={`${styles.chart_content} ${styles.empty_content}`}>
        <Empty description="No valid data to plot" />
      </main>
    );
  }

  const totalSeries = result.groups.reduce((total, group) => total + group.series.length, 0);
  const mergedDisplayTitle = result.groups
    .map((group) => group.title)
    .filter((value, index, all) => all.indexOf(value) === index)
    .join(', ');
  const defaultChartTitle = '折线图';
  const gridClassName =
    config.drawMode === 'merge' ? `${styles.chart_grid} ${styles.merged_grid}` : styles.chart_grid;

  return (
    <div className={styles.chart_content}>
      <div className={styles.chart_summary}>
        <span>{result.groups.length} groups</span>
        <span>{totalSeries} lines</span>
        <span>{result.validRows} valid points</span>

        {result.errors.length > 0 && (
          <div className={styles.issue_panel}>
            <Alert
              type="warning"
              content={`found ${result.errors.length} data issues, skipped ${result.skippedRows} rows of invalid plotting data.`}
            />
            <details>
              <summary>View Issue Details</summary>
              <ul>
                {result.errors.slice(0, 20).map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
              {result.errors.length > 20 && (
                <p>Only showing the first 20 issues, total {result.errors.length}.</p>
              )}
            </details>
          </div>
        )}
      </div>

      <div className={gridClassName}>
        {config.drawMode === 'merge' ? (
          <ChartCard
            chartId="__merged__"
            title={mergedDisplayTitle}
            chartTitle={chartTitles.__merged__ ?? defaultChartTitle}
            groups={result.groups}
            tableHeader={tableHeader}
            xColumn={config.xColumn}
            yColumn={config.yColumn}
            isMerged
            polylineData={polylineData}
            onChartTitleChange={onChartTitleChange}
          />
        ) : (
          result.groups.map((group) => (
            <ChartCard
              chartId={group.id}
              title={group.title}
              chartTitle={chartTitles[group.id] ?? defaultChartTitle}
              key={group.id}
              groups={[group]}
              tableHeader={tableHeader}
              xColumn={config.xColumn}
              yColumn={config.yColumn}
              isMerged={false}
              polylineData={polylineData}
              onChartTitleChange={onChartTitleChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
