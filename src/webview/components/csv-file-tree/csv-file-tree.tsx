import { Button, Empty, Tooltip, Tree, Typography, Upload } from '@arco-design/web-react';
import { IconDelete, IconFile } from '@arco-design/web-react/icon';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { TreeNodeProps } from '@arco-design/web-react';
import { useCsvFileList } from './hooks/use-csv-file-list';
import type { CsvFileItem, CsvTreeNode } from './types';
import { buildCsvTree, getCsvFileIdFromTreeKey, getCsvFileTreeKey } from './utils/csv-tree';
import styles from './styles.module.scss';

interface CsvFileTreeProps {
  files: CsvFileItem[];
  checkedFileIds: string[];
  activeFileId: string | null;
  onCheckedFileIdsChange: (fileIds: string[]) => void;
  onActiveFileIdChange: (fileId: string) => void;
  onRemoveFile: (fileId: string) => void;
}

function getTreeNodeData(node: TreeNodeProps): CsvTreeNode | undefined {
  return node.dataRef as CsvTreeNode | undefined;
}

export function CsvFileTree({
  files,
  checkedFileIds,
  activeFileId,
  onCheckedFileIdsChange,
  onActiveFileIdChange,
  onRemoveFile,
}: CsvFileTreeProps) {
  console.log('CsvFileTree render', { files, checkedFileIds, activeFileId });
  const treeData = buildCsvTree(files);

  const renderTitle = (node: TreeNodeProps): ReactNode => {
    const data = getTreeNodeData(node);
    const title = typeof node.title === 'string' ? node.title : (data?.title ?? '');
    const titleContent = (
      <span className={styles.tree_title}>
        {data?.nodeType === 'file' ? <IconFile /> : null}
        <span className={styles.tree_title_text}>{title}</span>
      </span>
    );

    if (data?.nodeType !== 'file' || !data.fullPath) {
      return titleContent;
    }

    return <Tooltip content={data.fullPath}>{titleContent}</Tooltip>;
  };

  const renderExtra = (node: TreeNodeProps): ReactNode => {
    const data = getTreeNodeData(node);

    if (data?.nodeType !== 'file' || !data.fileId) {
      return null;
    }

    return (
      <Button
        className={styles.tree_action}
        type="text"
        size="mini"
        icon={<IconDelete />}
        aria-label={`Remove ${data.title}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemoveFile(data.fileId as string);
        }}
      />
    );
  };

  if (treeData.length === 0) {
    return <Empty className={styles.tree_empty} description="No CSV files" />;
  }

  return (
    <div className={styles.tree_container}>
      <Tree
        className={styles.tree}
        blockNode
        checkable
        checkStrictly
        showLine
        treeData={treeData}
        checkedKeys={checkedFileIds.map(getCsvFileTreeKey)}
        selectedKeys={activeFileId ? [getCsvFileTreeKey(activeFileId)] : []}
        defaultExpandedKeys={treeData.map((node) => node.key)}
        onCheck={(checkedKeys) => {
          const fileIds = checkedKeys
            .map(getCsvFileIdFromTreeKey)
            .filter((fileId): fileId is string => fileId !== null);
          onCheckedFileIdsChange(fileIds);
        }}
        onSelect={(selectedKeys) => {
          const selectedFileId = selectedKeys[0] ? getCsvFileIdFromTreeKey(selectedKeys[0]) : null;
          if (selectedFileId) {
            onActiveFileIdChange(selectedFileId);
          }
        }}
        renderTitle={renderTitle}
        renderExtra={renderExtra}
      />
    </div>
  );
}

export interface CsvFileTreeWorkbenchProps {
  onActiveFileChange?: (file: CsvFileItem | null) => void;
}

export function CsvFileTreeWorkbench({ onActiveFileChange }: CsvFileTreeWorkbenchProps) {
  const {
    files,
    checkedFileIds,
    activeFileId,
    addFiles,
    setActiveFileId,
    setCheckedFileIds,
    removeFile,
    removeCheckedFiles,
  } = useCsvFileList();

  const activeFile = files.find((file) => file.id === activeFileId) ?? null;

  useEffect(() => {
    onActiveFileChange?.(activeFile);
  }, [activeFile, onActiveFileChange]);

  return (
    <section className={styles.file_tree_workbench} aria-label="CSV files">
      <div className={styles.file_tree_toolbar}>
        <Upload
          multiple
          accept={{ type: '.csv,text/csv', strict: false }}
          autoUpload={false}
          showUploadList={false}
          beforeUpload={(file) => {
            addFiles([file]);
            return false;
          }}
        >
          <Button type="primary" icon={<IconFile />}>
            Add CSV
          </Button>
        </Upload>

        <Typography.Text type="secondary">
          {files.length === 0 ? 'No files selected' : `${files.length} file(s)`}
        </Typography.Text>

        {checkedFileIds.length > 0 ? (
          <Button
            className={styles.remove_checked_button}
            type="text"
            size="small"
            icon={<IconDelete />}
            onClick={removeCheckedFiles}
          >
            Remove selected ({checkedFileIds.length})
          </Button>
        ) : null}
      </div>

      {activeFile ? (
        <Typography.Text className={styles.active_file} ellipsis>
          {activeFile.fileName}
        </Typography.Text>
      ) : null}

      <CsvFileTree
        files={files}
        checkedFileIds={checkedFileIds}
        activeFileId={activeFileId}
        onCheckedFileIdsChange={setCheckedFileIds}
        onActiveFileIdChange={setActiveFileId}
        onRemoveFile={removeFile}
      />
    </section>
  );
}
