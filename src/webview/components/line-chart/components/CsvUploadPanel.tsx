import { Button, Typography, Upload } from '@arco-design/web-react';
import { IconFile } from '@arco-design/web-react/icon';
import styles from '../styles.module.scss';

interface CsvUploadPanelProps {
  fileName: string | null;
  isLoading: boolean;
  onFileSelect: (file: File) => void;
}

export function CsvUploadPanel({
  fileName,
  isLoading,
  onFileSelect,
}: CsvUploadPanelProps) {
  return (
    <section className={styles.upload_panel} aria-label="CSV 文件上传">
      <div className={styles.upload_content}>
        <Upload
          accept={{ type: '.csv,text/csv', strict: false }}
          autoUpload={false}
          showUploadList={false}
          beforeUpload={(file) => {
            onFileSelect(file);
            return false;
          }}
        >
          <Button type="primary" icon={<IconFile />} loading={isLoading}>
            上传 CSV
          </Button>
        </Upload>

        <div className={styles.file_meta}>
          <Typography.Text ellipsis>
            {fileName ?? '尚未选择文件'}
          </Typography.Text>
        </div>
      </div>
    </section>
  );
}
