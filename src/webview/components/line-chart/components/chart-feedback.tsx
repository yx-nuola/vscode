import { Alert } from '@arco-design/web-react';
import type { LineChartFeedback } from '../types';
import styles from '../styles.module.scss';

interface ChartFeedbackProps {
  feedback: LineChartFeedback | null;
}

const ALERT_TYPES = {
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const;

export function ChartFeedback({ feedback }: ChartFeedbackProps) {
  if (!feedback) {
    return null;
  }

  return (
    <Alert
      className={styles.chart_feedback}
      type={ALERT_TYPES[feedback.tone]}
      content={feedback.message}
      showIcon
    />
  );
}
