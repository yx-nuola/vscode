import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from 'react-grid-layout';

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

interface LayoutData {
  cards: CardConfig[];
  visibleCardIds: string[];
  timestamp: number;
}

interface UseWorkbenchReturn {
  cards: CardConfig[];
  cardData: Map<string, unknown[]>;
  visibleCards: Set<string>;
  isLoading: boolean;
  layout: Layout[];
  handleLayoutChange: (newLayout: Layout[]) => void;
  handleCardClose: (cardId: string) => void;
  handleVisibleCardsChange: (visibleIds: string[]) => void;
  resetLayout: () => void;
  updateCardData: (cardId: string, data: unknown[]) => void;
}

const DEFAULT_CARDS: CardConfig[] = [
  { id: 'card-1', type: 'echarts', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { id: 'card-2', type: 'logicflow', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
  { id: 'card-3', type: 'canvas', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
  { id: 'card-4', type: 'echarts', x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 }
];

export function useWorkbench(): UseWorkbenchReturn {
  const [cards, setCards] = useState<CardConfig[]>(DEFAULT_CARDS);
  const [cardData, setCardData] = useState<Map<string, unknown[]>>(new Map());
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set(DEFAULT_CARDS.map(c => c.id)));
  const [isLoading, setIsLoading] = useState(true);
  const [layout, setLayout] = useState<Layout[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        if (window.electronAPI) {
          const savedLayout = await window.electronAPI.loadLayout(window.id);
          if (savedLayout && savedLayout.cards && savedLayout.cards.length > 0) {
            setCards(savedLayout.cards);
            setVisibleCards(new Set(savedLayout.visibleCardIds || []));
          }
        }
      } catch (error) {
        console.error('[useWorkbench] Failed to load layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  const saveLayout = useCallback((newCards: CardConfig[], newVisibleCards: Set<string>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const layoutData: LayoutData = {
        cards: newCards,
        visibleCardIds: Array.from(newVisibleCards),
        timestamp: Date.now()
      };

      if (window.electronAPI) {
        window.electronAPI.saveLayout(window.id, layoutData);
      }
    }, 500);
  }, []);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    setLayout(newLayout);

    setCards(prevCards => {
      const newCards = prevCards.map(card => {
        const layoutItem = newLayout.find(l => l.i === card.id);
        if (layoutItem) {
          return { ...card, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
        }
        return card;
      });
      saveLayout(newCards, visibleCards);
      return newCards;
    });
  }, [visibleCards, saveLayout]);

  const handleCardClose = useCallback((cardId: string) => {
    setCards(prevCards => {
      const newCards = prevCards.filter(c => c.id !== cardId);
      saveLayout(newCards, visibleCards);
      return newCards;
    });
    setVisibleCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
  }, [visibleCards, saveLayout]);

  const handleVisibleCardsChange = useCallback((visibleIds: string[]) => {
    setVisibleCards(new Set(visibleIds));
    saveLayout(cards, new Set(visibleIds));
  }, [cards, saveLayout]);

  const resetLayout = useCallback(() => {
    setCards(DEFAULT_CARDS);
    setVisibleCards(new Set(DEFAULT_CARDS.map(c => c.id)));
    setLayout([]);
    saveLayout(DEFAULT_CARDS, new Set(DEFAULT_CARDS.map(c => c.id)));
  }, [saveLayout]);

  const updateCardData = useCallback((cardId: string, data: unknown[]) => {
    setCardData(prev => {
      const newMap = new Map(prev);
      newMap.set(cardId, data);
      return newMap;
    });
  }, []);

  return {
    cards,
    cardData,
    visibleCards,
    isLoading,
    layout,
    handleLayoutChange,
    handleCardClose,
    handleVisibleCardsChange,
    resetLayout,
    updateCardData
  };
}
