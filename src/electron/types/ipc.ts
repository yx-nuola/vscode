export interface DataChunk {
  cardId: string;
  chunkIndex: number;
  totalChunks: number;
  isLast: boolean;
  data: ArrayBuffer;
}

export type ExtToMain =
  | { type: 'LOAD_DATA'; cardIds: string[] }
  | { type: 'CANCEL_LOAD'; cardIds?: string[] }
  | { type: 'WINDOW_READY' }
  | { type: 'GET_VISIBLE_CARDS' };

export type MainToRenderer =
  | { type: 'DATA_CHUNK'; cardId: string; chunk: ArrayBuffer; meta: { index: number; total: number } }
  | { type: 'DATA_COMPLETE'; cardId: string }
  | { type: 'DATA_ERROR'; cardId: string; error: string }
  | { type: 'WINDOW_READY_ACK' }
  | { type: 'VISIBLE_CARDS'; cardIds: string[] };

export type RendererToMain =
  | { type: 'CHUNK_PROCESSED'; cardId: string; chunkIndex: number }
  | { type: 'REQUEST_MORE'; cardId: string }
  | { type: 'SAVE_LAYOUT'; layout: LayoutData }
  | { type: 'LOAD_LAYOUT' }
  | { type: 'RESET_LAYOUT' }
  | { type: 'SET_VISIBLE_CARDS'; cardIds: string[] };

export interface LayoutData {
  cards: CardConfig[];
  visibleCardIds: string[];
  timestamp: number;
}

export interface CardConfig {
  id: string;
  type: CardType;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export type CardType = 'echarts' | 'logicflow' | 'canvas';

export interface CardData {
  cardId: string;
  type: CardType;
  rawData: ArrayBuffer;
  parsedData?: unknown;
}

export interface IceServiceData {
  cardId: string;
  type: CardType;
  data: unknown[];
}

export interface ParsedResult {
  cardId: string;
  data: unknown[];
  error?: string;
}
