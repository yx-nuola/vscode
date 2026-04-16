import * as vscode from 'vscode';

interface IceServiceConfig {
  endpoint: string;
  timeout: number;
  retries: number;
  retryInterval: number;
}

interface IceServiceResponse {
  cardId: string;
  type: 'echarts' | 'logicflow' | 'canvas';
  data: unknown[];
}

const DEFAULT_CONFIG: IceServiceConfig = {
  endpoint: 'http://localhost:8080/api/data',
  timeout: 5000,
  retries: 3,
  retryInterval: 500
};

class IceService {
  private config: IceServiceConfig;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(config: Partial<IceServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async fetchCardData(cardId: string, type: 'echarts' | 'logicflow' | 'canvas'): Promise<IceServiceResponse> {
    const controller = new AbortController();
    this.abortControllers.set(cardId, controller);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        const response = await this.makeRequest(cardId, type, controller.signal);
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (this.isAbortError(error)) {
          throw new Error(`请求已取消: ${cardId}`);
        }

        if (attempt < this.config.retries - 1) {
          await this.delay(this.config.retryInterval);
        }
      }
    }

    throw new Error(`获取卡片数据失败 (${cardId}): ${lastError?.message}`);
  }

  public async fetchAllCardData(cardIds: string[]): Promise<Map<string, IceServiceResponse>> {
    const results = new Map<string, IceServiceResponse>();
    const promises = cardIds.map(async (cardId) => {
      const type = this.getCardType(cardId);
      const data = await this.fetchCardData(cardId, type);
      results.set(cardId, data);
    });

    await Promise.allSettled(promises);
    return results;
  }

  public cancelRequest(cardId: string): void {
    const controller = this.abortControllers.get(cardId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(cardId);
    }
  }

  public cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  private async makeRequest(
    cardId: string,
    type: 'echarts' | 'logicflow' | 'canvas',
    signal: AbortSignal
  ): Promise<IceServiceResponse> {
    const url = `${this.config.endpoint}?cardId=${encodeURIComponent(cardId)}&type=${type}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: signal,
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(() => {
          return this.getMockResponse(cardId, type) as unknown as Response;
        });

        clearTimeout(timeoutId);

      if (!response || response.status === 404) {
        return this.getMockResponse(cardId, type);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json() as { data?: unknown[] };
      return {
        cardId,
        type,
        data: jsonData.data || []
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (signal.aborted) {
        throw new Error('请求被取消');
      }
      
      throw error;
    }
  }

  private getMockResponse(cardId: string, type: 'echarts' | 'logicflow' | 'canvas'): IceServiceResponse {
    const data = this.generateMockData(type);
    return { cardId, type, data };
  }

  private generateMockData(type: 'echarts' | 'logicflow' | 'canvas'): unknown[] {
    switch (type) {
      case 'echarts':
        return Array.from({ length: 5000 }, (_, i) => ({
          value: Math.random() * 1000,
          index: i,
          name: `数据点 ${i}`
        }));
      case 'logicflow':
        return Array.from({ length: 50 }, (_, i) => ({
          id: `node-${i}`,
          label: `节点 ${i + 1}`,
          x: Math.random() * 800,
          y: Math.random() * 600,
          type: i % 3 === 0 ? 'start' : i % 3 === 1 ? 'process' : 'end'
        }));
      case 'canvas':
        return Array.from({ length: 10000 }, (_, i) => ({
          x: Math.random() * 2000,
          y: Math.random() * 2000,
          value: Math.random() * 100
        }));
      default:
        return [];
    }
  }

  private getCardType(cardId: string): 'echarts' | 'logicflow' | 'canvas' {
    if (cardId.includes('chart') || cardId.includes('1')) {
      return 'echarts';
    }
    if (cardId.includes('flow') || cardId.includes('2')) {
      return 'logicflow';
    }
    return 'canvas';
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('aborted') ||
      error.message.includes('canceled') ||
      error.message.includes('请求被取消')
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public updateConfig(config: Partial<IceServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

const iceService = new IceService();

export { IceService, iceService };
