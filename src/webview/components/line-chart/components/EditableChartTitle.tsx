import { useEffect, useState } from 'react';
import { Button, Input, Tooltip } from '@arco-design/web-react';
import { IconEdit } from '@arco-design/web-react/icon';
import styles from '../styles.module.scss';

interface EditableChartTitleProps {
  title: string;
  onChange: (title: string) => void;
}

export function EditableChartTitle({
  title,
  onChange,
}: EditableChartTitleProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    if (!editing) {
      setDraftTitle(title);
    }
  }, [editing, title]);

  const save = (): void => {
    const nextTitle = draftTitle.trim();
    onChange(nextTitle || title);
    setEditing(false);
  };

  if (editing) {
    return (
      <Tooltip content={draftTitle}>
      <Input
        autoFocus
        className={styles.chart_title_input}
        value={draftTitle}
        onChange={setDraftTitle}
        onBlur={save}
        onPressEnter={save}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setDraftTitle(title);
            setEditing(false);
          }
        }}
        aria-label="编辑图表标题"
      />
      </Tooltip>
    );
  }

  return (
    <Button
      type="text"
      className={styles.chart_title}
      // icon={<IconEdit />}
      onClick={() => setEditing(true)}
      title="点击修改标题"
    >
      {title}
    </Button>
  );
}
