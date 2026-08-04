import type { LineChartConfig, ParsedCsvData } from '../types';
import { findDeviceColumn } from './data-adapter';

export function createDefaultConfig(data: ParsedCsvData): LineChartConfig {
  const deviceColumn = findDeviceColumn(data.columns);

  return {
    xColumn: null,
    yColumn: '',
    deviceColumn: deviceColumn?.rawName ?? null,
    groupColumns: [],
    drawMode: 'split',
  };
}

export function validateChartConfig(
  data: ParsedCsvData,
  config: LineChartConfig,
): string | null {
  if (!config.yColumn) {
    return '请选择 Y 轴字段';
  }

  const numericSelections = [
    ...(config.xColumn ? [{ role: 'X 轴', name: config.xColumn }] : []),
    { role: 'Y 轴', name: config.yColumn },
    ...config.groupColumns.map((name) => ({ role: 'Group', name })),
  ];

  for (const selection of numericSelections) {
    const column = data.columns.find(
      (candidate) => candidate.rawName === selection.name,
    );

    if (!column) {
      return `${selection.role}字段 ${selection.name} 不存在`;
    }

    if (column.inferredType === 'string') {
      return `${selection.role}字段 ${selection.name} 不能转换为数值`;
    }
  }

  if (
    config.deviceColumn &&
    !data.columns.some((column) => column.rawName === config.deviceColumn)
  ) {
    return `大组字段 ${config.deviceColumn} 不存在`;
  }

  return null;
}
