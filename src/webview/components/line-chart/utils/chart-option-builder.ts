import type { EChartsOption } from 'echarts';
import type { ChartGroupData, CsvColumn, ParsedCsvRow } from '../types';
import { buildAxisRange } from './axis-range';
import {
  createSeriesColors,
  formatAxisValue,
  SERIES_LINE_TYPES,
  SERIES_SYMBOLS,
} from './chart-style';

export interface DisplaySeries {
  id: string;
  name: string;
  points: [number, number, number][];
}

interface TooltipParameter {
  data?: [number, number, number];
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
      points: series.points,
    })),
  );
}

export function buildChartOption(
  displaySeries: DisplaySeries[],
  tableHeader: CsvColumn[],
  xColumn: string | null,
  yColumn: string,
  polylineData: ParsedCsvRow[],
): EChartsOption {

  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  for (const series of displaySeries) {
    for (const point of series.points) {
      const x = point[0];
      const y = point[1];
      if (Number.isFinite(x)) {
        xMin = Math.min(xMin, x);
        xMax = Math.max(xMax, x);
      }
      if (Number.isFinite(y)) {
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
      }
    }
  }

  const xRange = buildAxisRange(xMin, xMax);
  const yRange = buildAxisRange(yMin, yMax);

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
      formatter: (parameter: unknown) =>
        formatTooltip(parameter, tableHeader, polylineData),
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
      // showSymbol: true,
      symbol: SERIES_SYMBOLS[index % SERIES_SYMBOLS.length],
      symbolSize: 7,
      lineStyle: {
        type: SERIES_LINE_TYPES[index % SERIES_LINE_TYPES.length],
      },
      connectNulls: false,
      data: series.points,
    })),
  };
}

function formatTooltip(
  parameter: unknown,
  tableHeader: CsvColumn[],
  polylineData: ParsedCsvRow[],
): string {
  const tooltipParameter = Array.isArray(parameter)
    ? parameter[0] as TooltipParameter | undefined
    : parameter as TooltipParameter;
  const data = tooltipParameter?.data;
  const row = Array.isArray(data) ? polylineData[data[2]] : undefined;

  if (!row) {
    return '';
  }

  const detailRows = tableHeader.map((column) => {
    const value = row[column.rawName];
    return `<div><span>${escapeHtml(column.displayName)}:</span> ${escapeHtml(value ?? '')}</div>`;
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
