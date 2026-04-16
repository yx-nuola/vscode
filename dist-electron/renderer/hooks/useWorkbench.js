"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWorkbench = useWorkbench;
const react_1 = require("react");
const DEFAULT_CARDS = [
    { id: 'card-1', type: 'echarts', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { id: 'card-2', type: 'logicflow', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { id: 'card-3', type: 'canvas', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
    { id: 'card-4', type: 'echarts', x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 }
];
function useWorkbench() {
    const [cards, setCards] = (0, react_1.useState)(DEFAULT_CARDS);
    const [cardData, setCardData] = (0, react_1.useState)(new Map());
    const [visibleCards, setVisibleCards] = (0, react_1.useState)(new Set(DEFAULT_CARDS.map(c => c.id)));
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [layout, setLayout] = (0, react_1.useState)([]);
    const saveTimeoutRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        const loadLayout = async () => {
            try {
                if (window.electronAPI) {
                    const savedLayout = await window.electronAPI.loadLayout(window.id);
                    if (savedLayout && savedLayout.cards && savedLayout.cards.length > 0) {
                        setCards(savedLayout.cards);
                        setVisibleCards(new Set(savedLayout.visibleCardIds || []));
                    }
                }
            }
            catch (error) {
                console.error('[useWorkbench] Failed to load layout:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadLayout();
    }, []);
    const saveLayout = (0, react_1.useCallback)((newCards, newVisibleCards) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            const layoutData = {
                cards: newCards,
                visibleCardIds: Array.from(newVisibleCards),
                timestamp: Date.now()
            };
            if (window.electronAPI) {
                window.electronAPI.saveLayout(window.id, layoutData);
            }
        }, 500);
    }, []);
    const handleLayoutChange = (0, react_1.useCallback)((newLayout) => {
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
    const handleCardClose = (0, react_1.useCallback)((cardId) => {
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
    const handleVisibleCardsChange = (0, react_1.useCallback)((visibleIds) => {
        setVisibleCards(new Set(visibleIds));
        saveLayout(cards, new Set(visibleIds));
    }, [cards, saveLayout]);
    const resetLayout = (0, react_1.useCallback)(() => {
        setCards(DEFAULT_CARDS);
        setVisibleCards(new Set(DEFAULT_CARDS.map(c => c.id)));
        setLayout([]);
        saveLayout(DEFAULT_CARDS, new Set(DEFAULT_CARDS.map(c => c.id)));
    }, [saveLayout]);
    const updateCardData = (0, react_1.useCallback)((cardId, data) => {
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
