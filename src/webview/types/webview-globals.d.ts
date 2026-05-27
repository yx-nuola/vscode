export {};

declare global {
  interface Window {
    __WEBVIEW_INITIAL_ROUTE__?: string;
  }
}
