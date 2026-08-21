import { useCallback, useRef, useState } from 'react';
import { createCsvFileItem } from '../utils/csv-path';
import type { CsvFileItem } from '../types';

interface CsvFileListState {
  files: CsvFileItem[];
  checkedFileIds: string[];
  activeFileId: string | null;
  addFiles: (incomingFiles: File[]) => CsvFileItem[];
  setActiveFileId: (fileId: string) => void;
  setCheckedFileIds: (fileIds: string[]) => void;
  removeFile: (fileId: string) => void;
  removeCheckedFiles: () => void;
}

export function useCsvFileList(): CsvFileListState {
  const [files, setFiles] = useState<CsvFileItem[]>([]);
  const [checkedFileIds, setCheckedFileIdsState] = useState<string[]>([]);
  const [activeFileId, setActiveFileIdState] = useState<string | null>(null);
  const filesRef = useRef<CsvFileItem[]>([]);
  const checkedFileIdsRef = useRef<string[]>([]);
  const activeFileIdRef = useRef<string | null>(null);

  const addFiles = useCallback((incomingFiles: File[]): CsvFileItem[] => {
    const existingIds = new Set(filesRef.current.map((file) => file.id));
    const newFiles = incomingFiles.map(createCsvFileItem).filter((file) => {
      if (existingIds.has(file.id)) {
        return false;
      }

      existingIds.add(file.id);
      return true;
    });

    if (newFiles.length === 0) {
      return [];
    }

    const nextFiles = [...filesRef.current, ...newFiles];
    filesRef.current = nextFiles;
    setFiles(nextFiles);

    if (!activeFileIdRef.current) {
      activeFileIdRef.current = newFiles[0].id;
      setActiveFileIdState(newFiles[0].id);
    }

    return newFiles;
  }, []);

  const setActiveFileId = useCallback((fileId: string): void => {
    if (!filesRef.current.some((file) => file.id === fileId)) {
      return;
    }

    activeFileIdRef.current = fileId;
    setActiveFileIdState(fileId);
  }, []);

  const setCheckedFileIds = useCallback((fileIds: string[]): void => {
    const fileIdSet = new Set(filesRef.current.map((file) => file.id));
    const nextCheckedFileIds = fileIds.filter((fileId) => fileIdSet.has(fileId));

    checkedFileIdsRef.current = nextCheckedFileIds;
    setCheckedFileIdsState(nextCheckedFileIds);
  }, []);

  const removeFile = useCallback((fileId: string): void => {
    const nextFiles = filesRef.current.filter((file) => file.id !== fileId);

    if (nextFiles.length === filesRef.current.length) {
      return;
    }

    filesRef.current = nextFiles;
    setFiles(nextFiles);

    const nextCheckedFileIds = checkedFileIdsRef.current.filter((id) => id !== fileId);
    checkedFileIdsRef.current = nextCheckedFileIds;
    setCheckedFileIdsState(nextCheckedFileIds);

    if (activeFileIdRef.current === fileId) {
      activeFileIdRef.current = null;
      setActiveFileIdState(null);
    }
  }, []);

  const removeCheckedFiles = useCallback((): void => {
    if (checkedFileIdsRef.current.length === 0) {
      return;
    }

    const checkedIds = new Set(checkedFileIdsRef.current);
    const nextFiles = filesRef.current.filter((file) => !checkedIds.has(file.id));

    if (nextFiles.length === filesRef.current.length) {
      return;
    }

    filesRef.current = nextFiles;
    setFiles(nextFiles);
    checkedFileIdsRef.current = [];
    setCheckedFileIdsState([]);

    if (activeFileIdRef.current && checkedIds.has(activeFileIdRef.current)) {
      activeFileIdRef.current = null;
      setActiveFileIdState(null);
    }
  }, []);

  return {
    files,
    checkedFileIds,
    activeFileId,
    addFiles,
    setActiveFileId,
    setCheckedFileIds,
    removeFile,
    removeCheckedFiles,
  };
}
