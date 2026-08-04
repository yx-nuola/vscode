import { useMemo, useState } from 'react';
import { ChartConfigPanel } from './components/ChartConfigPanel';
import { ChartContent } from './components/ChartContent';
import { ChartFeedback } from './components/ChartFeedback';
import { CsvUploadPanel } from './components/CsvUploadPanel';
import { useCsvUpload } from './hooks/useCsvUpload';
import type { BuildChartResult, LineChartConfig } from './types';
import { createDefaultConfig, validateChartConfig } from './utils/config-validator';
import { buildChartGroups } from './utils/group-builder';
import styles from './styles.module.scss';

export function LineChartWorkbench() {
  const [draftConfig, setDraftConfig] = useState<LineChartConfig | null>(null);
  const [appliedConfig, setAppliedConfig] = useState<LineChartConfig | null>(null);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const {
    fileName,
    parsedData,
    isLoading,
    feedback,
    setFeedback,
    uploadFile,
  } = useCsvUpload();

  const chartResult = useMemo<BuildChartResult | null>(() => {
    if (!parsedData || !appliedConfig) {
      return null;
    }

    return buildChartGroups(parsedData.rows, appliedConfig);
  }, [appliedConfig, parsedData]);

  const handleFileSelect = async (file: File): Promise<void> => {
    const data = await uploadFile(file);

    if (!data) {
      setDraftConfig(null);
      setAppliedConfig(null);
      setTitles({});
      return;
    }

    setDraftConfig(createDefaultConfig(data));
    setAppliedConfig(null);
    setTitles({});
  };

  const handleConfigChange = (config: LineChartConfig): void => {
    setDraftConfig(config);
    setFeedback(null);
  };

  const handleDraw = (): void => {
    if (!parsedData || !draftConfig) {
      setFeedback({ tone: 'warning', message: '请先上传 CSV 文件' });
      return;
    }

    const validationMessage = validateChartConfig(parsedData, draftConfig);

    if (validationMessage) {
      setFeedback({ tone: 'warning', message: validationMessage });
      return;
    }

    setAppliedConfig({ ...draftConfig });
    setFeedback(null);
  };

  return (
    <div className={styles.line_chart_workbench}>
      <header className={styles.header_area}>
        <CsvUploadPanel
          fileName={fileName}
          rowCount={parsedData?.rows.length ?? 0}
          isLoading={isLoading}
          onFileSelect={(file) => {
            void handleFileSelect(file);
          }}
        />
        <ChartFeedback feedback={feedback} />
        <ChartConfigPanel
          columns={parsedData?.columns ?? []}
          config={draftConfig}
          onConfigChange={handleConfigChange}
          onDraw={handleDraw}
        />
      </header>

      <ChartContent
        result={chartResult}
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
