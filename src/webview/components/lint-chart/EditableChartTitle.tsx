import { useEffect, useRef, useState } from 'react';
import { IconEdit } from '@arco-design/web-react/icon';

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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) {
      setDraftTitle(title);
    }
  }, [editing, title]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = (): void => {
    const nextTitle = draftTitle.trim();
    onChange(nextTitle || title);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="line-chart-title__input"
        value={draftTitle}
        onChange={(event) => setDraftTitle(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            save();
          } else if (event.key === 'Escape') {
            setDraftTitle(title);
            setEditing(false);
          }
        }}
        aria-label="编辑图表标题"
      />
    );
  }

  return (
    <button
      type="button"
      className="line-chart-title"
      onClick={() => setEditing(true)}
      title="点击修改标题"
    >
      <span>{title}</span>
      <IconEdit />
    </button>
  );
}

