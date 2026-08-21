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

// export function buildCsvTree(files: CsvFileItem[]): CsvTreeNode[] {
//   const roots: CsvTreeNode[] = [];
//   const folders = new Map<string, CsvTreeNode>();

//   files.forEach((file) => {
//     const pathScope = getCsvPathScope(file.fullPath);
//     const directorySegments = file.pathSegments.slice(0, -1);
//     let siblings = roots;

//     directorySegments.forEach((segment, index) => {
//       const folderPath = directorySegments
//         .slice(0, index + 1)
//         .join('/')
//         .toLowerCase();
//       const folderKey = `folder:${pathScope}/${folderPath}`;
//       let folder = folders.get(folderKey);

//       if (!folder) {
//         folder = {
//           key: folderKey,
//           title: segment,
//           nodeType: 'folder',
//           checkable: false,
//           selectable: false,
//           children: [],
//         };
//         folders.set(folderKey, folder);
//         siblings.push(folder);
//       }

//       siblings = folder.children ?? [];
//     });

//     siblings.push({
//       key: getCsvFileTreeKey(file.id),
//       title: file.fileName,
//       nodeType: 'file',
//       fileId: file.id,
//       fullPath: file.fullPath,
//       isLeaf: true,
//       checkable: true,
//     });
//   });

//   sortTreeNodes(roots);
//   return roots;
// }

// 树节点类型（与 Arco Design 的 Tree 组件匹配）
interface TreeNode {
  key: string; // 绝对路径（唯一标识）
  title: string; // 显示名称（最后一级）
  isLeaf: boolean; // 是否为文件
  children?: TreeNode[];
}

/**
 * 从文件路径列表构建树形数据
 * - 自动去除磁盘盘符（C:、D: 等）并压缩单分支目录
 * - 每个节点的 key 使用绝对路径，方便后续定位
 * @param filePaths 绝对路径字符串数组（如从 VS Code 获取的 fsPath）
 * @returns Arco Tree 组件的 treeData
 */
export function buildCsvTree(filePaths: string[]): TreeNode[] {
  debbuger;
  if (!filePaths || filePaths.length === 0) {
    return [];
  }

  // 1. 规范化路径（统一使用 / 分隔符）
  const normalized = filePaths.map((p) => p.replace(/\\/g, '/'));

  // 2. 构建完整树（使用虚拟根）
  const root: TreeNode = { key: '', title: '', isLeaf: false, children: [] };

  normalized.forEach((fullPath) => {
    const parts = fullPath.split('/').filter((part) => part.length > 0);
    let current = root;
    let accumulated = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      accumulated = i === 0 ? part : accumulated + '/' + part;
      const isLeaf = i === parts.length - 1;

      // 查找是否已有该节点
      let child = current.children?.find((c) => c.key === accumulated);
      if (!child) {
        child = {
          key: accumulated,
          title: part,
          isLeaf,
        };
        if (!isLeaf) {
          child.children = [];
        }
        if (!current.children) {
          current.children = [];
        }
        current.children.push(child);
      }
      current = child;
    }
  });

  // 3. 压缩单分支节点（去除磁盘和冗余中间目录）
  function compress(node: TreeNode): TreeNode {
    if (node.isLeaf) {
      return node;
    }

    // 先递归压缩子节点
    if (node.children) {
      node.children = node.children.map(compress);
    }

    // 如果当前节点只有一个子节点且该子节点不是文件，则提升子节点
    if (node.children && node.children.length === 1 && !node.children[0].isLeaf) {
      return node.children[0];
    }
    return node;
  }

  let compressed = root.children?.map(compress) || [];

  // 4. 美化磁盘名称（去掉冒号）
  function sanitizeDiskName(node: TreeNode): TreeNode {
    if (node.title && typeof node.title === 'string' && node.title.endsWith(':')) {
      node.title = node.title.slice(0, -1); // 'C:' -> 'C'
    }
    if (node.children) {
      node.children = node.children.map(sanitizeDiskName);
    }
    return node;
  }

  compressed = compressed.map(sanitizeDiskName);

  return compressed;
}
