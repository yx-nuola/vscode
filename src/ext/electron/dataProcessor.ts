interface DataChunk {
  cardId: string;
  chunkIndex: number;
  totalChunks: number;
  isLast: boolean;
  data: ArrayBuffer;
}

interface CardData {
  cardId: string;
  type: 'echarts' | 'logicflow' | 'canvas';
  data: unknown[];
}

const CHUNK_SIZE = 2000;
const CHUNK_INTERVAL = 50;

class DataProcessor {
  private pendingChunks: Map<string, DataChunk[]> = new Map();
  private onChunkCallback: ((chunk: DataChunk) => void) | null = null;

  public setOnChunkCallback(callback: (chunk: DataChunk) => void): void {
    this.onChunkCallback = callback;
  }

  public processCardData(cardData: CardData): DataChunk[] {
    const jsonString = JSON.stringify(cardData.data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(jsonString);
    
    const chunks: DataChunk[] = [];
    const totalChunks = Math.ceil(encoded.length / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, encoded.length);
      const chunkData = encoded.slice(start, end);
      
      const chunk: DataChunk = {
        cardId: cardData.cardId,
        chunkIndex: i,
        totalChunks,
        isLast: i === totalChunks - 1,
        data: chunkData.buffer.slice(chunkData.byteOffset, chunkData.byteOffset + chunkData.byteLength)
      };
      
      chunks.push(chunk);
    }
    
    this.pendingChunks.set(cardData.cardId, chunks);
    return chunks;
  }

  public async sendChunksWithBackpressure(chunks: DataChunk[]): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (this.onChunkCallback) {
        this.onChunkCallback(chunk);
      }
      
      if (i < chunks.length - 1) {
        await this.delay(CHUNK_INTERVAL);
      }
    }
  }

  public convertToArrayBuffer(data: unknown[]): ArrayBuffer {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(jsonString);
    return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
  }

  public parseArrayBuffer(buffer: ArrayBuffer): unknown[] {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(buffer);
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  }

  public convertFloat32Array(data: { x: number; y: number }[]): ArrayBuffer {
    const buffer = new ArrayBuffer(data.length * 2 * 4);
    const view = new Float32Array(buffer);
    
    for (let i = 0; i < data.length; i++) {
      view[i * 2] = data[i].x;
      view[i * 2 + 1] = data[i].y;
    }
    
    return buffer;
  }

  public parseFloat32Array(buffer: ArrayBuffer): { x: number; y: number }[] {
    const view = new Float32Array(buffer);
    const result: { x: number; y: number }[] = [];
    
    for (let i = 0; i < view.length; i += 2) {
      result.push({ x: view[i], y: view[i + 1] });
    }
    
    return result;
  }

  public clearPendingChunks(cardId: string): void {
    this.pendingChunks.delete(cardId);
  }

  public clearAllPendingChunks(): void {
    this.pendingChunks.clear();
  }

  public getPendingChunkCount(cardId: string): number {
    return this.pendingChunks.get(cardId)?.length || 0;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const dataProcessor = new DataProcessor();

export { DataProcessor, dataProcessor };
export type { DataChunk, CardData };
