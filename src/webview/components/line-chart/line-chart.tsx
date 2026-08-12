import { useMemo, useState } from 'react';
import { ChartConfigPanel } from './components/chart-config';
import { ChartContent } from './components/chart-content';
import { ChartFeedback } from './components/chart-feedback';
import { CsvUploadPanel } from './components/csv-upload';
import { useCsvUpload } from './hooks/use-csv-upload';
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

    return buildChartGroups(parsedData.polylineData, appliedConfig);
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
    debugger;
    if (!parsedData || !draftConfig) {
      setFeedback({ tone: 'warning', message: 'Please upload a CSV file first' });
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
      <div className={styles.header_area}>
        <CsvUploadPanel
          fileName={fileName}
          isLoading={isLoading}
          onFileSelect={(file) => {
            void handleFileSelect(file);
          }}
        />
        <ChartFeedback feedback={feedback} />
        <ChartConfigPanel
          tableHeader={parsedData?.tableHeader ?? []}
          config={draftConfig}
          onConfigChange={handleConfigChange}
          onDraw={handleDraw}
        />
      </div>

      <ChartContent
        result={chartResult}
        tableHeader={parsedData?.tableHeader ?? []}
        config={appliedConfig}
        fileName={fileName}
        titles={titles}
        polylineData={parsedData?.polylineData ?? []}
        onTitleChange={(chartId, title) => {
          setTitles((current) => ({ ...current, [chartId]: title }));
        }}
      />
    </div>
  );
}
