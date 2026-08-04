import type {
  BuildChartResult,
  ChartGroupData,
  ChartPoint,
  ChartSeriesData,
  LineChartConfig,
  ParsedCsvRow,
} from '../types';
import { parseFiniteNumber } from './csv-parser';

export function shouldStartNewSmallGroup(
  previousValues: number[],
  currentValues: number[],
): boolean {
  if (previousValues.length !== currentValues.length) {
    throw new Error('Group 比较字段数量不一致');
  }

  const hasDecrease = currentValues.some(
    (value, index) => value < previousValues[index],
  );
  const isExactRepeat = currentValues.every(
    (value, index) => value === previousValues[index],
  );

  return hasDecrease || isExactRepeat;
}

export function buildChartGroups(
  rows: ParsedCsvRow[],
  config: LineChartConfig,
): BuildChartResult {
  const groups: ChartGroupData[] = [];
  const errors: BuildChartResult['errors'] = [];
  let previousValidRow: ParsedCsvRow | null = null;
  let currentBigGroup: ChartGroupData | null = null;
  let currentSeries: ChartSeriesData | null = null;
  let validRows = 0;

  for (const row of rows) {
    const validationError = getRowValidationError(row, config);

    if (validationError) {
      errors.push({
        sourceRowIndex: row.sourceRowIndex,
        message: validationError,
      });
      continue;
    }

    const deviceValue = getDeviceValue(row, config.deviceColumn);
    const previousDeviceValue = previousValidRow
      ? getDeviceValue(previousValidRow, config.deviceColumn)
      : null;
    const isNewBigGroup =
      !previousValidRow || deviceValue !== previousDeviceValue;

    if (isNewBigGroup) {
      currentBigGroup = createBigGroup(groups.length + 1, deviceValue, config);
      groups.push(currentBigGroup);
      currentSeries = createSmallGroup(currentBigGroup);
    } else if (
      currentBigGroup &&
      currentSeries &&
      previousValidRow &&
      config.groupColumns.length > 0
    ) {
      const previousValues = getGroupValues(previousValidRow, config.groupColumns);
      const currentValues = getGroupValues(row, config.groupColumns);

      if (shouldStartNewSmallGroup(previousValues, currentValues)) {
        currentSeries = createSmallGroup(currentBigGroup);
      }
    }

    if (!currentSeries) {
      throw new Error('无法创建折线小组');
    }

    currentSeries.points.push(createChartPoint(row, config, currentSeries.points.length));
    validRows += 1;
    previousValidRow = row;
  }

  return {
    groups,
    validRows,
    skippedRows: rows.length - validRows,
    errors,
  };
}

function createBigGroup(
  bigGroupIndex: number,
  deviceValue: string,
  config: LineChartConfig,
): ChartGroupData {
  const title = config.deviceColumn
    ? `${config.deviceColumn}=${deviceValue}`
    : '全部数据';

  return {
    id: `big-group-${bigGroupIndex}-${encodeURIComponent(deviceValue)}`,
    deviceValue,
    bigGroupIndex,
    title,
    series: [],
  };
}

function createSmallGroup(group: ChartGroupData): ChartSeriesData {
  const smallGroupIndex = group.series.length + 1;
  const series: ChartSeriesData = {
    id: `${group.id}-group-${smallGroupIndex}`,
    name: `Group ${smallGroupIndex}`,
    smallGroupIndex,
    points: [],
  };

  group.series.push(series);
  return series;
}

function createChartPoint(
  row: ParsedCsvRow,
  config: LineChartConfig,
  localIndex: number,
): ChartPoint {
  const y = parseFiniteNumber(row.values[config.yColumn]);
  const x = config.xColumn
    ? parseFiniteNumber(row.values[config.xColumn])
    : localIndex;

  if (x === null || y === null) {
    throw new Error('有效行无法转换为图表数据点');
  }

  return {
    x,
    y,
    sourceRowIndex: row.sourceRowIndex,
    raw: row,
  };
}

function getRowValidationError(
  row: ParsedCsvRow,
  config: LineChartConfig,
): string | null {
  if (config.deviceColumn && row.values[config.deviceColumn]?.trim() === '') {
    return `大组字段 ${config.deviceColumn} 为空`;
  }

  if (
    config.xColumn &&
    parseFiniteNumber(row.values[config.xColumn] ?? '') === null
  ) {
    return `X 轴字段 ${config.xColumn} 不是有效数字`;
  }

  if (parseFiniteNumber(row.values[config.yColumn] ?? '') === null) {
    return `Y 轴字段 ${config.yColumn} 不是有效数字`;
  }

  for (const column of config.groupColumns) {
    if (parseFiniteNumber(row.values[column] ?? '') === null) {
      return `Group 字段 ${column} 不是有效数字`;
    }
  }

  return null;
}

function getDeviceValue(
  row: ParsedCsvRow,
  deviceColumn: string | null,
): string {
  return deviceColumn ? row.values[deviceColumn] : '__all__';
}

function getGroupValues(
  row: ParsedCsvRow,
  groupColumns: string[],
): number[] {
  return groupColumns.map((column) => {
    const value = parseFiniteNumber(row.values[column]);

    if (value === null) {
      throw new Error(`Group 字段 ${column} 不是有效数字`);
    }

    return value;
  });
}
