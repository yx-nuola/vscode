import React, { useEffect, useState, useCallback } from 'react';
import { useWorkbench } from './hooks/useWorkbench';
import WorkbenchLayout from './components/WorkbenchLayout';
import SkeletonScreen from './components/SkeletonScreen';
import { cardDataManager } from './utils/CardDataManager';

const App: React.FC = () => {
  const {
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
  } = useWorkbench();

  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleMessage = (message: {
      type?: string;
      cardId?: string;
      chunk?: ArrayBuffer;
      meta?: { index?: number; total?: number };
      error?: string;
    }) => {
      console.log('[App] Received message:', message);

      if (message.type === 'DATA_CHUNK' && message.cardId && message.chunk) {
        const chunkIndex = message.meta?.index || 0;
        const totalChunks = message.meta?.total || 1;
        
        cardDataManager.addChunk(message.cardId, chunkIndex, message.chunk);

        const isLastChunk = chunkIndex === totalChunks - 1 || totalChunks === 1;
        
        if (isLastChunk) {
          cardDataManager.parseData(message.cardId).then((result: { error?: string; data: unknown[] }) => {
            if (!result.error && result.data) {
              updateCardData(message.cardId!, result.data);
              
              if (window.electronAPI) {
                window.electronAPI.sendToMain({
                  type: 'CHUNK_PROCESSED',
                  cardId: message.cardId,
                  chunkIndex: chunkIndex
                });
              }
            }
          });
        } else {
          if (window.electronAPI) {
            window.electronAPI.sendToMain({
              type: 'CHUNK_PROCESSED',
              cardId: message.cardId,
              chunkIndex: chunkIndex
            });
          }
        }
      } else if (message.type === 'DATA_ERROR' && message.cardId) {
        console.error('[App] Data error:', message.error);
        updateCardData(message.cardId, []);
      }
    };

    window.electronAPI.onRendererMessage(handleMessage);

    return () => {
      window.electronAPI?.removeRendererListener();
    };
  }, [updateCardData]);

  if (isLoading || showSkeleton) {
    return <SkeletonScreen />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>图形化工作台</h1>
        <button onClick={resetLayout}>重置布局</button>
      </header>
      <main className="app-main">
        <WorkbenchLayout
          cards={cards}
          cardData={cardData}
          visibleCards={visibleCards}
          onLayoutChange={handleLayoutChange}
          onCardClose={handleCardClose}
          onVisibleCardsChange={handleVisibleCardsChange}
        />
      </main>
    </div>
  );
};

export default App;
