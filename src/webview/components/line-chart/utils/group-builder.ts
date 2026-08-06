import type {
  BuildChartResult,
  ChartGroupData,
  ChartSeriesData,
  LineChartConfig,
  ParsedCsvRow,
} from '../types';
import { parseFiniteNumber } from './csv-parser';

export function shouldStartNewSmallGroup(
  previousValues: number[] | null,
  currentValues: number[] | null,
): boolean {
  if (previousValues === null || currentValues === null) {
    return false;
  }

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
  polylineData: ParsedCsvRow[],
  config: LineChartConfig,
): BuildChartResult {

  debugger;
  const groups: ChartGroupData[] = [];
  const errors: BuildChartResult['errors'] = [];
  let previousValidRow: ParsedCsvRow | null = null;
  let currentBigGroup: ChartGroupData | null = null;
  let currentSeries: ChartSeriesData | null = null;
  let validRows = 0;

  for (const [rowIndex, row] of polylineData.entries()) {
    const validationError = getRowValidationError(row, config);

    if (validationError) {
      errors.push({
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

    const point = createChartPoint(
      row,
      config,
      currentSeries.points.length,
      rowIndex,
    );
    if (point === null) {
      previousValidRow = row;
      continue;
    }

    currentSeries.points.push(point);
    validRows += 1;
    previousValidRow = row;
  }

  return {
    groups,
    validRows,
    skippedRows: polylineData.length - validRows,
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
  rowIndex: number,
): [number, number, number] | null {
  const y = parseFiniteNumber(row[config.yColumn]);
  const x = config.xColumn
    ? parseFiniteNumber(row[config.xColumn])
    : localIndex;

  if (x === null || y === null) {
    return null;
  }

  return [
    x,
    y,
    rowIndex,
  ];
}

function getRowValidationError(
  row: ParsedCsvRow,
  config: LineChartConfig,
): string | null {
  if (config.deviceColumn && row[config.deviceColumn]?.trim() === '') {
    return `大组字段 ${config.deviceColumn} 为空`;
  }

  // if (
  //   config.xColumn &&
  //   parseFiniteNumber(row[config.xColumn]) === null
  // ) {
  //   return `X 轴字段 ${config.xColumn} 不是有效数字`;
  // }

  // if (parseFiniteNumber(row[config.yColumn]) === null) {
  //   return `Y 轴字段 ${config.yColumn} 不是有效数字`;
  // }

  // for (const column of config.groupColumns) {
  //   if (parseFiniteNumber(row[column]) === null) {
  //     return `Group 字段 ${column} 不是有效数字`;
  //   }
  // }

  return null;
}

function getDeviceValue(
  row: ParsedCsvRow,
  deviceColumn: string | null,
): string {
  return deviceColumn ? row[deviceColumn] ?? '' : '__all__';
}

function getGroupValues(
  row: ParsedCsvRow,
  groupColumns: string[],
): number[] | null {
  const values: number[] = [];

  for (const column of groupColumns) {
    const value = parseFiniteNumber(row[column]);

    if (value === null) {
      return null;
    }

    values.push(value);
  }

  return values;
}
