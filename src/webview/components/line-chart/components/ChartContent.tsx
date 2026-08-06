import { Alert, Empty } from '@arco-design/web-react';
import type {
  BuildChartResult,
  CsvColumn,
  LineChartConfig,
  ParsedCsvRow,
} from '../types';
import { ChartCard } from './ChartCard';
import styles from '../styles.module.scss';

interface ChartContentProps {
  result: BuildChartResult | null;
  tableHeader: CsvColumn[];
  config: LineChartConfig | null;
  fileName: string | null;
  titles: Record<string, string>;
  polylineData: ParsedCsvRow[];
  onTitleChange: (chartId: string, title: string) => void;
}

export function ChartContent({
  result,
  tableHeader,
  config,
  fileName,
  titles,
  polylineData,
  onTitleChange,
}: ChartContentProps) {

  console.log('ChartContent render', result, tableHeader, config, fileName, titles, polylineData);

  if (!result || !config) {
    return (
      <main className={`${styles.chart_content} ${styles.empty_content}`}>
        <Empty
          description={
            fileName
              ? '请选择 X 轴、Y 轴和 Group，点击 Draw 绘制折线图'
              : '请先上传 CSV 文件'
          }
        />
      </main>
    );
  }

  if (result.groups.length === 0) {
    return (
      <main className={`${styles.chart_content} ${styles.empty_content}`}>
        <Empty description="没有可绘制的有效数据" />
      </main>
    );
  }

  const totalSeries = result.groups.reduce(
    (total, group) => total + group.series.length,
    0,
  );
  const mergedTitle = titles.__merged__ ?? fileName ?? 'CSV 折线图';
  const gridClassName = config.drawMode === 'merge'
    ? `${styles.chart_grid} ${styles.merged_grid}`
    : styles.chart_grid;

  return (
    <div className={styles.chart_content}>
      <div className={styles.chart_summary}>
        <span>{result.groups.length} 个大组</span>
        <span>{totalSeries} 条折线</span>
        <span>{result.validRows} 个有效点</span>

        {result.errors.length > 0 && (
          <div className={styles.issue_panel}>
            <Alert
              type="warning"
              content={`共发现 ${result.errors.length} 条数据问题，已跳过 ${result.skippedRows} 行无效绘图数据。`}
            />
            <details>
              <summary>查看问题明细</summary>
              <ul>
                {result.errors.slice(0, 20).map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
              {result.errors.length > 20 && (
                <p>仅展示前 20 条，共 {result.errors.length} 条。</p>
              )}
            </details>
          </div>
        )}
      </div>

      <div className={gridClassName}>
        {config.drawMode === 'merge' ? (
          <ChartCard
            chartId="__merged__"
            title={mergedTitle}
            groups={result.groups}
            tableHeader={tableHeader}
            xColumn={config.xColumn}
            yColumn={config.yColumn}
            isMerged
            polylineData={polylineData}
            onTitleChange={onTitleChange}
          />
        ) : (
          result.groups.map((group) => (
            <ChartCard
              chartId={group.id}
              title={titles[group.id] ?? group.title}
              key={group.id}
              groups={[group]}
              tableHeader={tableHeader}
              xColumn={config.xColumn}
              yColumn={config.yColumn}
              isMerged={false}
              polylineData={polylineData}
              onTitleChange={onTitleChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
