import { useState } from 'react';
import type { LineChartFeedback, ParsedCsvData } from '../types';
import { addVirtualDeviceId } from '../utils/data-adapter';
import { parseCsv } from '../utils/csv-parser';

interface CsvUploadState {
  fileName: string | null;
  parsedData: ParsedCsvData | null;
  isLoading: boolean;
  feedback: LineChartFeedback | null;
  setFeedback: (feedback: LineChartFeedback | null) => void;
  uploadFile: (file: File) => Promise<ParsedCsvData | null>;
}

export function useCsvUpload(): CsvUploadState {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<LineChartFeedback | null>(null);

  const uploadFile = async (file: File): Promise<ParsedCsvData | null> => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const text = await file.text();
      const data = addVirtualDeviceId(parseCsv(text));

      setFileName(file.name);
      setParsedData(data);
      setFeedback({
        tone: 'success',
        message: `已解析 ${data.rows.length} 行数据，请选择配置后点击 Draw`,
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV 解析失败';

      setFileName(null);
      setParsedData(null);
      setFeedback({ tone: 'error', message });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fileName,
    parsedData,
    isLoading,
    feedback,
    setFeedback,
    uploadFile,
  };
}
