import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CardProps {
  id: string;
  type: 'echarts' | 'logicflow' | 'canvas';
  title?: string;
  data?: unknown[];
  onClose?: (id: string) => void;
  isVisible?: boolean;
}

const Card: React.FC<CardProps> = ({
  id,
  type,
  title,
  data,
  onClose,
  isVisible = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && data.length > 0) {
      setLoading(false);
    }
  }, [data]);

  const handleClose = useCallback(() => {
    onClose?.(id);
  }, [id, onClose]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="card-loading">
          <span>加载中...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="card-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>重试</button>
        </div>
      );
    }

    switch (type) {
      case 'echarts':
        return <EChartsRenderer data={data} containerRef={containerRef} />;
      case 'logicflow':
        return <LogicFlowRenderer data={data} />;
      case 'canvas':
        return <CanvasRenderer data={data} containerRef={containerRef} />;
      default:
        return <div>Unknown type</div>;
    }
  };

  return (
    <div className="card" data-card-id={id} style={{ willChange: 'transform' }}>
      <div className="card-header">
        <span className="card-title">{title || `${type} 卡片`}</span>
        <button className="card-close" onClick={handleClose}>×</button>
      </div>
      <div className="card-content" ref={containerRef}>
        {renderContent()}
      </div>
    </div>
  );
};

const EChartsRenderer: React.FC<{ data?: unknown[]; containerRef: React.RefObject<HTMLDivElement> }> = ({ data, containerRef }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;

    const loadECharts = async () => {
      try {
        const echarts = await import('echarts');
        const chart = echarts.init(chartRef.current!);
        
        const option = {
          title: { text: '数据图表' },
          tooltip: {},
          xAxis: { type: 'category', data: data.map((_, i) => i) },
          yAxis: { type: 'value' },
          series: [{
            type: 'line',
            data: data.map((d: unknown) => (d as { value?: number }).value ?? 0),
            smooth: true
          }]
        };

        chart.setOption(option);

        return () => {
          chart.dispose();
        };
      } catch (e) {
        console.error('ECharts load error:', e);
      }
    };

    loadECharts();
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
};

const LogicFlowRenderer: React.FC<{ data?: unknown[] }> = ({ data }) => {
  return (
    <div className="logicflow-container">
      <div style={{ padding: '10px', color: '#666' }}>
        LogicFlow 流程图组件 - 数据节点数: {data?.length || 0}
      </div>
    </div>
  );
};

const CanvasRenderer: React.FC<{ data?: unknown[]; containerRef: React.RefObject<HTMLDivElement> }> = ({ data, containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderData = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const sampleSize = Math.min(data.length, 1000);
      const step = Math.floor(data.length / sampleSize);
      
      ctx.beginPath();
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 1;

      for (let i = 0; i < sampleSize; i++) {
        const index = i * step;
        const item = data[index] as { x?: number; y?: number } | undefined;
        if (item) {
          const x = (item.x ?? i) % rect.width;
          const y = (item.y ?? 0) % rect.height;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      
      ctx.stroke();
    };

    renderData();
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default Card;
