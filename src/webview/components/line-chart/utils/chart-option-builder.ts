import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import type { ChartGroupData, CsvColumn, ParsedCsvRow } from '../types';
import { buildAxisRange, type AxisRange } from './axis-range';
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
  const result = groups.flatMap((group) =>
    group.series.map((series) => ({
      id: series.id,
      name: isMerged ? `${group.deviceValue} / ${series.name}` : series.name,
      points: series.points,
    })),
  );

  console.log('createDisplaySeries', { groups, isMerged, result });
  return result;
}

export function buildChartOption(
  displaySeries: DisplaySeries[],
  tableHeader: CsvColumn[],
  xColumn: string | null,
  yColumn: string,
  polylineData: ParsedCsvRow[],
  chartTitle: string | null,
): EChartsOption {

  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  const xValues: number[] = [];

  for (const series of displaySeries) {
    for (const point of series.points) {
      const x = point[0];
      const y = point[1];
      if (Number.isFinite(x)) {
        xValues.push(x);
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
  const xPadding = computeXPadding(xValues, xRange);

  return {
    animation: false,
    color: createSeriesColors(displaySeries.length),
    grid: {
      top: 40,
      right: 20,
      bottom: 56,
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
      // backgroundColor: 'rgba(50, 50, 50, 0.7)',
      formatter: (parameter: unknown) =>
        formatTooltip(parameter, tableHeader, polylineData),
    },
    toolbox: {
      show: true,
      feature: {
        dataZoom: { yAxisIndex: 'none' },
        magicType: { type: [ 'bar'] },
        restore: {},
        mySaveAsImage: {
          show: true,
          title: '保存图片',
          icon: 'M4.7,22.9L29.3,45.5L54.7,23.4M4.6,43.6L4.6,58L53.8,58L53.8,43.6M29.2,45.1L29.2,0',
          onclick: (_ecModel: unknown, api: { getDom: () => HTMLElement }) => {
            const chart = echarts.getInstanceByDom(api.getDom());
            if (!chart) {
              return;
            }

            if (chartTitle) {
              chart.setOption({
                title: {
                  text: chartTitle,
                  left: 16,
                  top: 8,
                  textStyle: { fontSize: 14, fontWeight: 600 },
                },
              });
            }

            const url = chart.getDataURL({
              type: 'png',
              // backgroundColor: '#000',
              pixelRatio: 2,
              excludeComponents: ['toolbox'],
            });

            chart.setOption({ title: { show: false } });

            const anchor = document.createElement('a');
            anchor.download = `${chartTitle || 'chart'}.png`;
            anchor.target = '_blank';
            anchor.href = url;
            anchor.dispatchEvent(
              new MouseEvent('click', {
                view: document.defaultView,
                bubbles: true,
                cancelable: false,
              }),
            );
          },
        },
      },
    },
    xAxis: {
      type: 'value',
      name: xColumn ?? 'Index',
      nameLocation: 'middle',
      nameGap: 28,
      min: xRange ? xRange.min - xPadding : undefined,
      max: xRange ? xRange.max + xPadding : undefined,
      splitNumber: 10,
      axisLine: { onZero: false },
      axisLabel: {
        hideOverlap: true,
        formatter: (value: number) => formatAxisValue(value),
      },
      // splitLine: { show: false },
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
        color: 'red',
        hideOverlap: true,
        formatter: (value: number) => formatAxisValue(value),
      },
      // splitLine: { show: false },
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
      barMaxWidth: 40,
      emphasis: { scale: 2 },
      data: series.points,
    })),
  };
}

function computeMinGap(values: number[]): number | null {
  if (values.length < 2) {
    return null;
  }

  const sorted = Array.from(new Set(values)).sort((a, b) => a - b);
  if (sorted.length < 2) {
    return null;
  }

  let minGap = Number.POSITIVE_INFINITY;
  for (let index = 1; index < sorted.length; index += 1) {
    const gap = sorted[index] - sorted[index - 1];
    if (gap > 0 && gap < minGap) {
      minGap = gap;
    }
  }

  return Number.isFinite(minGap) ? minGap : null;
}

function computeXPadding(
  xValues: number[],
  xRange: AxisRange | null,
): number {
  const minGap = computeMinGap(xValues);
  if (minGap !== null) {
    return minGap / 2;
  }
  return xRange ? (xRange.max - xRange.min) * 0.02 : 0;
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
