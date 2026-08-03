import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import type { ChartGroupData, ChartPoint, CsvColumn } from './types';
import { calculateAxisRange } from './utils/axis-range';
import {
  createSeriesColors,
  formatAxisValue,
  SERIES_LINE_TYPES,
  SERIES_SYMBOLS,
} from './utils/chart-style';
import { EditableChartTitle } from './EditableChartTitle';

interface DisplaySeries {
  id: string;
  name: string;
  deviceValue: string;
  groupName: string;
  points: ChartPoint[];
}

interface LineChartCardProps {
  chartId: string;
  title: string;
  groups: ChartGroupData[];
  columns: CsvColumn[];
  xColumn: string | null;
  yColumn: string;
  isMerged: boolean;
  onTitleChange: (chartId: string, title: string) => void;
}

interface TooltipDatum {
  point: ChartPoint;
  deviceValue: string;
  groupName: string;
}

interface TooltipParameter {
  data?: TooltipDatum;
  marker?: string;
  seriesName?: string;
}

export function LineChartCard({
  chartId,
  title,
  groups,
  columns,
  xColumn,
  yColumn,
  isMerged,
  onTitleChange,
}: LineChartCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const displaySeries = useMemo(
    () => createDisplaySeries(groups, isMerged),
    [groups, isMerged],
  );
  const option = useMemo(
    () => buildChartOption(displaySeries, columns, xColumn, yColumn),
    [columns, displaySeries, xColumn, yColumn],
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let chart: echarts.EChartsType | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const initializeChart = (): void => {
      if (chart) {
        return;
      }

      chart = echarts.init(container);
      chart.setOption(option, true);
      resizeObserver = new ResizeObserver(() => chart?.resize());
      resizeObserver.observe(container);
    };

    if (typeof IntersectionObserver === 'undefined') {
      initializeChart();
    } else {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            initializeChart();
            intersectionObserver?.disconnect();
            intersectionObserver = null;
          }
        },
        { rootMargin: '400px 0px' },
      );
      intersectionObserver.observe(container);
    }

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      chart?.dispose();
    };
  }, [option]);

  return (
    <article className="line-chart-card">
      <header className="line-chart-card__header">
        <EditableChartTitle
          title={title}
          onChange={(nextTitle) => onTitleChange(chartId, nextTitle)}
        />
        <span className="line-chart-card__meta">
          {displaySeries.length} 条曲线
        </span>
      </header>
      <div ref={containerRef} className="line-chart-card__canvas" />
    </article>
  );
}

function createDisplaySeries(
  groups: ChartGroupData[],
  isMerged: boolean,
): DisplaySeries[] {
  return groups.flatMap((group) =>
    group.series.map((series) => ({
      id: series.id,
      name: isMerged
        ? `${group.deviceValue} / ${series.name}`
        : series.name,
      deviceValue: group.deviceValue,
      groupName: series.name,
      points: series.points,
    })),
  );
}

function buildChartOption(
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
      top: 24,
      right: 20,
      bottom: 92,
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
      axisPointer: {
        type: 'cross',
      },
      formatter: (parameter: unknown) =>
        formatTooltip(parameter, columns, xColumn, yColumn),
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

function formatTooltip(
  parameter: unknown,
  columns: CsvColumn[],
  xColumn: string | null,
  yColumn: string,
): string {
  const tooltipParameter = Array.isArray(parameter)
    ? parameter[0] as TooltipParameter | undefined
    : parameter as TooltipParameter;
  const datum = tooltipParameter?.data;

  if (!datum?.point) {
    return '';
  }

  const point = datum.point;
  const visibleColumns = columns.filter((column) =>
    point.raw.values[column.rawName] !== undefined,
  );
  const detailRows = visibleColumns.map((column) => {
    const value = point.raw.values[column.rawName];
    return `<div><span>${escapeHtml(column.displayName)}:</span> ${escapeHtml(value)}</div>`;
  });

  return [
    `<strong>${tooltipParameter?.marker ?? ''}${escapeHtml(tooltipParameter?.seriesName ?? '')}</strong>`,
    `<div><span>大组:</span> ${escapeHtml(datum.deviceValue)}</div>`,
    `<div><span>小组:</span> ${escapeHtml(datum.groupName)}</div>`,
    `<div><span>${escapeHtml(xColumn ?? 'Index')}:</span> ${formatNumber(point.x)}</div>`,
    `<div><span>${escapeHtml(yColumn)}:</span> ${formatNumber(point.y)}</div>`,
    `<div><span>CSV Row:</span> ${point.sourceRowIndex}</div>`,
    ...detailRows,
  ].join('');
}

function formatNumber(value: number): string {
  return Number(value.toPrecision(8)).toString();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
