import type { EChartsOption } from 'echarts';
import type { ChartGroupData, ChartPoint, CsvColumn } from '../types';
import { calculateAxisRange } from './axis-range';
import {
  createSeriesColors,
  formatAxisValue,
  SERIES_LINE_TYPES,
  SERIES_SYMBOLS,
} from './chart-style';

export interface DisplaySeries {
  id: string;
  name: string;
  deviceValue: string;
  groupName: string;
  points: ChartPoint[];
}

interface TooltipDatum {
  point: ChartPoint;
}

interface TooltipParameter {
  data?: TooltipDatum;
  marker?: string;
  seriesName?: string;
}

export function createDisplaySeries(
  groups: ChartGroupData[],
  isMerged: boolean,
): DisplaySeries[] {
  return groups.flatMap((group) =>
    group.series.map((series) => ({
      id: series.id,
      name: isMerged ? `${group.deviceValue} / ${series.name}` : series.name,
      deviceValue: group.deviceValue,
      groupName: series.name,
      points: series.points,
    })),
  );
}

export function buildChartOption(
  displaySeries: DisplaySeries[],
  columns: CsvColumn[],
  xColumn: string | null,
  yColumn: string,
): EChartsOption {
  const xValues = displaySeries.flatMap((series) =>
    series.points.map((point) => point.x),
  );
  const yValues = displaySeries.flatMap((series) =>
    series.points.map((point) => point.y),
  );
  const xRange = calculateAxisRange(xValues);
  const yRange = calculateAxisRange(yValues);

  return {
    animation: false,
    color: createSeriesColors(displaySeries.length),
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 20,
      containLabel: true,
    },
    legend: {
      type: 'scroll',
      bottom: 8,
      left: 16,
      right: 16,
    },
    tooltip: {
      trigger: 'item',
      axisPointer: { type: 'cross' },
      formatter: (parameter: unknown) => formatTooltip(parameter, columns),
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        magicType: { type: ['line', 'bar'] },
        restore: {},
        saveAsImage: {},
      },
    },
    xAxis: {
      type: 'value',
      name: xColumn ?? 'Index',
      nameLocation: 'middle',
      nameGap: 32,
      min: xRange?.min,
      max: xRange?.max,
      splitNumber: 6,
      axisLine: { onZero: false },
      axisLabel: {
        hideOverlap: true,
        formatter: (value: number) => formatAxisValue(value),
      },
    },
    yAxis: {
      type: 'value',
      name: yColumn,
      nameLocation: 'middle',
      nameGap: 50,
      min: yRange?.min,
      max: yRange?.max,
      splitNumber: 6,
      axisLine: { onZero: false },
      scale: true,
      axisLabel: {
        formatter: (value: number) => formatAxisValue(value),
      },
    },
    series: displaySeries.map((series, index) => ({
      id: series.id,
      name: series.name,
      type: 'line',
      showSymbol: true,
      symbol: SERIES_SYMBOLS[index % SERIES_SYMBOLS.length],
      symbolSize: 7,
      lineStyle: {
        type: SERIES_LINE_TYPES[index % SERIES_LINE_TYPES.length],
      },
      connectNulls: false,
      data: series.points.map((point) => ({
        value: [point.x, point.y],
        point,
        deviceValue: series.deviceValue,
        groupName: series.groupName,
      })),
    })),
  };
}

function formatTooltip(parameter: unknown, columns: CsvColumn[]): string {
  const tooltipParameter = Array.isArray(parameter)
    ? parameter[0] as TooltipParameter | undefined
    : parameter as TooltipParameter;
  const point = tooltipParameter?.data?.point;

  if (!point) {
    return '';
  }

  const detailRows = columns
    .filter((column) => point.raw.values[column.rawName] !== undefined)
    .map((column) => {
      const value = point.raw.values[column.rawName];
      return `<div><span>${escapeHtml(column.displayName)}:</span> ${escapeHtml(value)}</div>`;
    });

  return [
    `<strong>${tooltipParameter?.marker ?? ''}${escapeHtml(tooltipParameter?.seriesName ?? '')}</strong>`,
    ...detailRows,
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
