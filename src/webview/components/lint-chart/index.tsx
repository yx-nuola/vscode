import { useMemo, useState } from 'react';
import type {
  BuildChartResult,
  LineChartFeedback,
  LineChartConfig,
  ParsedCsvData,
} from './types';
import { LineChartToolbar } from './LineChartToolbar';
import { LineChartContent } from './LineChartContent';
import { parseCsv } from './utils/csv-parser';
import {
  addVirtualDeviceId,
  findDeviceColumn,
} from './utils/data-adapter';
import { buildChartGroups } from './utils/group-builder';
import './styles.css';

export function LineChartWorkbench() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [config, setConfig] = useState<LineChartConfig | null>(null);
  const [appliedConfig, setAppliedConfig] = useState<LineChartConfig | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<LineChartFeedback | null>(null);
  const result = useMemo<BuildChartResult | null>(() => {
    if (!parsedData || !appliedConfig) {
      return null;
    }

    return buildChartGroups(parsedData.rows, appliedConfig);
  }, [appliedConfig, parsedData]);


  console.log('LineChartCard render', result)

  const handleFileSelect = async (file: File): Promise<void> => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const text = await file.text();
      debugger
      const data = addVirtualDeviceId(parseCsv(text));
      const nextConfig = createDefaultConfig(data);

      setFileName(file.name);

      console.log('Parsed CSV Data:', data);
      setParsedData(data);
      setConfig(nextConfig);
      setAppliedConfig(null);
      setTitles({});
      setFeedback({
        tone: 'success',
        message: `已解析 ${data.rows.length} 行数据，请选择配置后点击 Draw`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV 解析失败';
      setFileName(null);
      setParsedData(null);
      setConfig(null);
      setAppliedConfig(null);
      setFeedback({ tone: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraw = (): void => {
    if (!config || !parsedData) {
      setFeedback({ tone: 'warning', message: '请先上传 CSV 文件' });
      return;
    }

    if (!config.yColumn) {
      setFeedback({ tone: 'warning', message: '请选择 Y 轴字段' });
      return;
    }

    const validationMessage = validateAxisAndGroupColumns(parsedData, config);

    if (validationMessage) {
      setFeedback({ tone: 'warning', message: validationMessage });
      return;
    }

    setAppliedConfig({ ...config });
    setFeedback(null);
  };

  return (
    <div className="line-chart-workbench">
      <LineChartToolbar
        columns={parsedData?.columns ?? []}
        config={config}
        fileName={fileName}
        rowCount={parsedData?.rows.length ?? 0}
        isLoading={isLoading}
        feedback={feedback}
        onFileSelect={(file) => {
          void handleFileSelect(file);
        }}
        onConfigChange={(nextConfig) => {
          setConfig(nextConfig);
          setFeedback(null);
        }}
        onDraw={handleDraw}
      />
      <LineChartContent
        result={result}
        columns={parsedData?.columns ?? []}
        config={appliedConfig}
        fileName={fileName}
        parseErrors={parsedData?.errors ?? []}
        titles={titles}
        onTitleChange={(chartId, title) => {
          setTitles((current) => ({ ...current, [chartId]: title }));
        }}
      />
    </div>
  );
}

function createDefaultConfig(data: ParsedCsvData): LineChartConfig {
  const deviceColumn = findDeviceColumn(data.columns);

  return {
    xColumn: null,
    yColumn: '',
    deviceColumn: deviceColumn?.rawName ?? null,
    groupColumns: [],
    drawMode: 'split',
  };
}

function validateAxisAndGroupColumns(
  data: ParsedCsvData,
  config: LineChartConfig,
): string | null {
  const selections = [
    ...(config.xColumn ? [{ role: 'X 轴', name: config.xColumn }] : []),
    { role: 'Y 轴', name: config.yColumn },
    ...config.groupColumns.map((name) => ({ role: 'Group', name })),
  ];

  for (const selection of selections) {
    const column = data.columns.find(
      (candidate) => candidate.rawName === selection.name,
    );

    if (!column) {
      return `${selection.role}字段 ${selection.name} 不存在`;
    }

    if (column.inferredType === 'string') {
      return `${selection.role}字段 ${selection.name} 不能转换为数值`;
    }
  }

  return null;
}
