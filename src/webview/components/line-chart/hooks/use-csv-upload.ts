import { useState } from 'react';
import type { LineChartFeedback, ParsedCsvData } from '../types';
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
      const text: any = (await file.text()) || '';
      const normalizedText = text.replace(/^\uFEFF/, '');
      const cleandText = normalizedText ? normalizedText.replaceAll(/\r\n/g, '\n').replaceAll(/\r/g, '\n').replaceAll(/\t/g, ',') : '';
      if (cleandText === '') {
        throw new Error('CSV file is empty');
      }
      const data = parseCsv(cleandText);
      

      setFileName(file.name);
      setParsedData(data);
      setFeedback({
        tone: 'success',
        message: `Analyzed ${data.polylineData.length} rows of data, please select configuration and click Draw`,
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'CSV Analysis error';

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
