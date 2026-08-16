import type { CsvFileItem, CsvTreeNode } from '../types';
import { getCsvPathScope } from './csv-path';

export function getCsvFileTreeKey(fileId: string): string {
  return `file:${fileId}`;
}

export function getCsvFileIdFromTreeKey(treeKey: string): string | null {
  return treeKey.startsWith('file:') ? treeKey.slice('file:'.length) : null;
}

function sortTreeNodes(nodes: CsvTreeNode[]): void {
  const collator = new Intl.Collator('zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });

  nodes.sort((left, right) => {
    if (left.nodeType !== right.nodeType) {
      return left.nodeType === 'folder' ? -1 : 1;
    }

    return collator.compare(left.title, right.title);
  });

  nodes.forEach((node) => {
    if (node.children) {
      sortTreeNodes(node.children);
    }
  });
}

export function buildCsvTree(files: CsvFileItem[]): CsvTreeNode[] {
  const roots: CsvTreeNode[] = [];
  const folders = new Map<string, CsvTreeNode>();

  files.forEach((file) => {
    const pathScope = getCsvPathScope(file.fullPath);
    const directorySegments = file.pathSegments.slice(0, -1);
    let siblings = roots;

    directorySegments.forEach((segment, index) => {
      const folderPath = directorySegments
        .slice(0, index + 1)
        .join('/')
        .toLowerCase();
      const folderKey = `folder:${pathScope}/${folderPath}`;
      let folder = folders.get(folderKey);

      if (!folder) {
        folder = {
          key: folderKey,
          title: segment,
          nodeType: 'folder',
          checkable: false,
          selectable: false,
          children: [],
        };
        folders.set(folderKey, folder);
        siblings.push(folder);
      }

      siblings = folder.children ?? [];
    });

    siblings.push({
      key: getCsvFileTreeKey(file.id),
      title: file.fileName,
      nodeType: 'file',
      fileId: file.id,
      fullPath: file.fullPath,
      isLeaf: true,
      checkable: true,
    });
  });

  sortTreeNodes(roots);
  return roots;
}
