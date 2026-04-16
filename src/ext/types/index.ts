export const EXTENSION_ID = 'my-extension';
export const PANEL_ID = `${EXTENSION_ID}.dataPanel`;

export const Commands = {
  REQUEST_DATA: 'requestData',
  RESPONSE_DATA: 'responseData',
  REFRESH_DATA: 'refreshData',
  LOAD_DATA: 'loadData',
} as const;

export interface DataItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface VSCodeMessage {
  command: string;
  requestId?: string;
  payload?: unknown;
}
