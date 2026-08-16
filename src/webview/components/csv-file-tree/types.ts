export interface CsvFileItem {
  id: string;
  fullPath: string;
  fileName: string;
  pathSegments: string[];
  sourceFile: File;
}

export type CsvTreeNodeType = 'folder' | 'file';

export interface CsvTreeNode {
  key: string;
  title: string;
  nodeType: CsvTreeNodeType;
  fileId?: string;
  fullPath?: string;
  isLeaf?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  children?: CsvTreeNode[];
}
