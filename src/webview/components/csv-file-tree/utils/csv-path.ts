import type { CsvFileItem } from '../types';

interface PathAwareFile extends File {
  path?: string;
}

export function getCsvFilePath(file: File): string {
  return (file as PathAwareFile).path ?? file.name;
}

export function normalizeCsvPath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function createCsvFileItem(file: File): CsvFileItem {
  const fullPath = getCsvFilePath(file);
  const normalizedPath = normalizeCsvPath(fullPath);
  const pathWithoutDrive = normalizedPath.replace(/^[A-Za-z]:\/?/, '');
  const pathSegments = pathWithoutDrive.split('/').filter(Boolean);
  const fileName = pathSegments[pathSegments.length - 1] ?? file.name;

  return {
    id: normalizedPath.toLowerCase(),
    fullPath,
    fileName,
    pathSegments,
    sourceFile: file,
  };
}

export function getCsvPathScope(fullPath: string): string {
  const normalizedPath = normalizeCsvPath(fullPath);
  const drive = normalizedPath.match(/^([A-Za-z]):(?:\/|$)/)?.[1];

  return drive ? `drive:${drive.toLowerCase()}` : 'path';
}
