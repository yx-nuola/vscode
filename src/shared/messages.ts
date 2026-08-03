import type { NotificationType, RequestType } from 'vscode-messenger-common';

export const EXTENSION_ID = 'my-extension';

export const ViewIds = {
  dataPanel: `${EXTENSION_ID}.dataPanel`,
  bitmapEditor: `${EXTENSION_ID}.bitmapEditor`,
} as const;

export const WebviewRoutes = {
  home: '/',
  bitmap: '/bitmap',
  lineChart: '/line-chart',
} as const;

export type WebviewRoute = typeof WebviewRoutes[keyof typeof WebviewRoutes];

export interface DataItem {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface RouteChangedPayload {
  path: string;
}

export interface NavigatePayload {
  path: string;
}

export interface ElectronStatusPayload {
  status: 'starting' | 'ready' | 'closed' | 'failed';
  message?: string;
}

export interface OpenElectronResult {
  ok: boolean;
  message?: string;
}

export const Requests = {
  getData: { method: 'webview.getData' } as RequestType<void, DataItem[]>,
  openElectron: { method: 'webview.openElectron' } as RequestType<void, OpenElectronResult>,
} as const;

export const Notifications = {
  webviewReady: { method: 'webview.ready' } as NotificationType<{ route: string }>,
  routeChanged: { method: 'webview.routeChanged' } as NotificationType<RouteChangedPayload>,
  refreshData: { method: 'webview.refreshData' } as NotificationType<void>,
  dataUpdated: { method: 'ext.dataUpdated' } as NotificationType<DataItem[]>,
  navigateTo: { method: 'ext.navigateTo' } as NotificationType<NavigatePayload>,
  electronStatusChanged: {
    method: 'ext.electronStatusChanged',
  } as NotificationType<ElectronStatusPayload>,
} as const;
