import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

export function useLazyECharts(option: EChartsOption) {
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  return containerRef;
}
