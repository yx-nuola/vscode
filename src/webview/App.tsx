import React from 'react';
import { BitmapActivityPanel } from './components/bitmap/components/BitmapActivityPanel';
import { BitmapEditorPage } from './components/bitmap/components/BitmapEditorPage';

declare global {
  interface Window {
    __BITMAP_WEBVIEW__?: {
      role?: 'activity' | 'editor';
      datasetId?: string;
    };
  }
}

const App: React.FC = () => {
  if (window.__BITMAP_WEBVIEW__?.role === 'editor') {
    return <BitmapEditorPage />;
  }

  return <BitmapActivityPanel />;
};

export default App;
