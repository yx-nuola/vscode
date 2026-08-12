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
    return 'please select a Y-axis column';
  }

  const numericSelections = [
    ...(config.xColumn ? [{ role: 'X Axis', name: config.xColumn }] : []),
    { role: 'Y Axis', name: config.yColumn },
    ...config.groupColumns.map((name) => ({ role: 'Group', name })),
  ];

  for (const selection of numericSelections) {
    const column = data.tableHeader.find(
      (candidate) => candidate.rawName === selection.name,
    );

    if (!column) {
      return `${selection.role} column ${selection.name} does not exist`;
    }
  }

  if (
    config.deviceColumn &&
    !data.tableHeader.some((column) => column.rawName === config.deviceColumn)
  ) {
    return `Device column ${config.deviceColumn} does not exist`;
  }

  return null;
}
