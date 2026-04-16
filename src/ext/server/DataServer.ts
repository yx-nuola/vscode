import { DataItem } from '../types';

export class DataServer {
  private apiUrl: string;

  constructor(apiUrl: string = 'https://api.example.com/data') {
    this.apiUrl = apiUrl;
  }

  async fetchData(): Promise<DataItem[]> {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as DataItem[];
    } catch (error) {
      console.error('[DataServer] Failed to fetch data:', error);
      return this.getMockData();
    }
  }

  getMockData(): DataItem[] {
    return [
      { id: '1', name: '张三', status: '活跃', createdAt: '2024-01-01' },
      { id: '2', name: '李四', status: '非活跃', createdAt: '2024-01-02' },
      { id: '3', name: '王五', status: '活跃', createdAt: '2024-01-03' },
      { id: '4', name: '赵六', status: '待审核', createdAt: '2024-01-04' },
      { id: '5', name: '钱七', status: '活跃', createdAt: '2024-01-05' },
    ];
  }
}

export const dataServer = new DataServer();
