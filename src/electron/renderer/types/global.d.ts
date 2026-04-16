interface LayoutData {
  cards: CardConfig[];
  visibleCardIds: string[];
  timestamp: number;
}

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

interface MainToRenderer {
  type: string;
  cardId?: string;
  chunk?: ArrayBuffer;
  meta?: { index: number; total: number };
  error?: string;
  cardIds?: string[];
}

interface RendererToMain {
  type: string;
  cardId?: string;
  chunkIndex?: number;
  layout?: LayoutData;
}

interface ElectronAPI {
  sendToMain: (message: RendererToMain) => void;
  onRendererMessage: (callback: (message: MainToRenderer) => void) => void;
  removeRendererListener: () => void;
  loadLayout: (windowId: number) => Promise<LayoutData | null>;
  saveLayout: (windowId: number, layout: LayoutData) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    id: number;
  }
}

export {};
