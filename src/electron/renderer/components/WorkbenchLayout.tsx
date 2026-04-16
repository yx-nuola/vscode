import React, { useState, useCallback, useEffect, useRef } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import Card from './Card';
import 'react-grid-layout/css/styles.css';

interface CardConfig {
  id: string;
  type: 'echarts' | 'logicflow' | 'canvas';
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface WorkbenchLayoutProps {
  cards: CardConfig[];
  cardData: Map<string, unknown[]>;
  visibleCards: Set<string>;
  onLayoutChange: (layout: Layout[]) => void;
  onCardClose: (cardId: string) => void;
  onVisibleCardsChange: (visibleIds: string[]) => void;
}

const DEFAULT_LAYOUT: CardConfig[] = [
  { id: 'card-1', type: 'echarts', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { id: 'card-2', type: 'logicflow', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { id: 'card-3', type: 'canvas', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
  { id: 'card-4', type: 'echarts', x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 }
];

const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  cards,
  cardData,
  visibleCards,
  onLayoutChange,
  onCardClose,
  onVisibleCardsChange
}) => {
  const [layout, setLayout] = useState<Layout[]>(() => {
    return cards.length > 0
      ? cards.map(c => ({ i: c.id, x: c.x, y: c.y, w: c.w, h: c.h, minW: c.minW, minH: c.minH }))
      : DEFAULT_LAYOUT.map(c => ({ i: c.id, x: c.x, y: c.y, w: c.w, h: c.h, minW: c.minW, minH: c.minH }));
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);
    onLayoutChange(newLayout);
  }, [onLayoutChange]);

  const handleClose = useCallback((cardId: string) => {
    onCardClose(cardId);
  }, [onCardClose]);

  return (
    <div ref={containerRef} className="workbench-layout" style={{ height: '100%', overflow: 'auto' }}>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={80}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".card-header"
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
      >
        {layout.map((item) => {
          const cardConfig = cards.find(c => c.id === item.i) || DEFAULT_LAYOUT.find(c => c.id === item.i);
          return (
            <div key={item.i} className="grid-item">
              <Card
                id={item.i}
                type={cardConfig?.type || 'echarts'}
                title={cardConfig?.type?.toUpperCase() || '卡片'}
                data={cardData.get(item.i)}
                onClose={handleClose}
                isVisible={visibleCards.has(item.i)}
              />
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};

export { DEFAULT_LAYOUT };
export default WorkbenchLayout;
