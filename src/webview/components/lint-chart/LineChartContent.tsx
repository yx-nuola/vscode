import { Alert, Empty } from '@arco-design/web-react';
import type {
  BuildChartResult,
  CsvColumn,
  CsvParseError,
  LineChartConfig,
} from './types';
import { LineChartCard } from './LineChartCard';

interface LineChartContentProps {
  result: BuildChartResult | null;
  columns: CsvColumn[];
  config: LineChartConfig | null;
  fileName: string | null;
  parseErrors: CsvParseError[];
  titles: Record<string, string>;
  onTitleChange: (chartId: string, title: string) => void;
}

export function LineChartContent({
  result,
  columns,
  config,
  fileName,
  parseErrors,
  titles,
  onTitleChange,
}: LineChartContentProps) {
  if (!result || !config) {
    return (
      <main className="line-chart-content line-chart-content--empty">
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
      <main className="line-chart-content line-chart-content--empty">
        <Empty description="没有可绘制的有效数据" />
      </main>
    );
  }

  const allErrors = [...parseErrors, ...result.errors];
  const totalErrors = allErrors.length;
  const mergedTitle = titles.__merged__ ?? fileName ?? 'CSV 折线图';

  return (
    <main className="line-chart-content">
      <div className="line-chart-content__summary">
        <span>{result.groups.length} 个大组</span>
        <span>
          {result.groups.reduce((total, group) => total + group.series.length, 0)} 条曲线
        </span>
        <span>{result.validRows} 个有效点</span>
        {totalErrors > 0 && (
          <div className="line-chart-content__issues">
            <Alert
              type="warning"
              content={`共发现 ${totalErrors} 条解析或数据问题，已跳过 ${result.skippedRows} 行无效绘图数据。`}
            />
            <details>
              <summary>查看问题明细</summary>
              <ul>
                {allErrors.slice(0, 20).map((error, index) => (
                  <li key={`${error.sourceRowIndex}-${index}`}>
                    第 {error.sourceRowIndex} 行：{error.message}
                  </li>
                ))}
              </ul>
              {allErrors.length > 20 && (
                <p>仅展示前 20 条，共 {allErrors.length} 条。</p>
              )}
            </details>
          </div>
        )}
      </div>

      <section
        className={
          config.drawMode === 'split'
            ? 'line-chart-content__grid'
            : 'line-chart-content__grid line-chart-content__grid--merged'
        }
      >
        {config.drawMode === 'merge' ? (
          <LineChartCard
            chartId="__merged__"
            title={mergedTitle}
            groups={result.groups}
            columns={columns}
            xColumn={config.xColumn}
            yColumn={config.yColumn}
            isMerged
            onTitleChange={onTitleChange}
          />
        ) : (
          result.groups.map((group) => (
            <LineChartCard
              key={group.id}
              chartId={group.id}
              title={titles[group.id] ?? group.title}
              groups={[group]}
              columns={columns}
              xColumn={config.xColumn}
              yColumn={config.yColumn}
              isMerged={false}
              onTitleChange={onTitleChange}
            />
          ))
        )}
      </section>
    </main>
  );
}
