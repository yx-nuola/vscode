import type { LineChartConfig, ParsedCsvData } from '../types';
import { findCurrentColumn, findDeviceColumn } from './data-adapter';

export function createDefaultConfig(data: ParsedCsvData): LineChartConfig {
  const deviceColumn = findDeviceColumn(data.tableHeader);
  const currentColumn = findCurrentColumn(data.tableHeader);

  return {
    xColumn: null,
    yColumn: currentColumn?.rawName ?? '',
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
    const column = data.tableHeader.find(
      (candidate) => candidate.rawName === selection.name,
    );

    if (!column) {
      return `${selection.role}字段 ${selection.name} 不存在`;
    }
  }

  if (
    config.deviceColumn &&
    !data.tableHeader.some((column) => column.rawName === config.deviceColumn)
  ) {
    return `大组字段 ${config.deviceColumn} 不存在`;
  }

  return null;
}
