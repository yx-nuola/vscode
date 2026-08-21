import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

export function useLazyECharts(option: EChartsOption) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const optionRef = useRef(option);
  optionRef.current = option;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    const initializeChart = (): void => {
      if (chartRef.current) {
        return;
      }

      chartRef.current = echarts.init(container);
      chartRef.current.setOption(optionRef.current, true);
      resizeObserver = new ResizeObserver(() => chartRef.current?.resize());
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
        { rootMargin: '400px 0px' }
      );
      intersectionObserver.observe(container);
    }

    console.log('useLazyECharts: chart initialized', resizeObserver, intersectionObserver);

    return () => {
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return containerRef;
}
