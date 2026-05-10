import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export type BitmapWebviewRole = 'activity' | 'editor';

export function getHtmlForWebview(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  role: BitmapWebviewRole,
  datasetId?: string
): string {
  const distPath = path.join(extensionUri.fsPath, 'dist-webview', 'index.html');

  if (!fs.existsSync(distPath)) {
    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bitmap</title>
        </head>
        <body>
          <div id="root">请先运行 npm run build:webview 构建 Webview</div>
        </body>
      </html>`;
  }

  let html = fs.readFileSync(distPath, 'utf-8');
  html = html.replace(
    /(<script[^>]*src=")([^"]+)(">)/g,
    (_match, prefix: string, src: string, suffix: string) => {
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return `${prefix}${src}${suffix}`;
      }
      const uri = vscode.Uri.file(path.join(extensionUri.fsPath, 'dist-webview', src));
      return `${prefix}${webview.asWebviewUri(uri).toString()}${suffix}`;
    }
  );

  html = html.replace(
    /(<link[^>]*href=")([^"]+)(">)/g,
    (_match, prefix: string, href: string, suffix: string) => {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return `${prefix}${href}${suffix}`;
      }
      const uri = vscode.Uri.file(path.join(extensionUri.fsPath, 'dist-webview', href));
      return `${prefix}${webview.asWebviewUri(uri).toString()}${suffix}`;
    }
  );

  const bootstrap = `<script>window.__BITMAP_WEBVIEW__=${JSON.stringify({ role, datasetId })};</script>`;
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource} data: https://*.vscode-cdn.net; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline';">`;

  return html
    .replace('<head>', `<head>${csp}`)
    .replace('<div id="root">', `${bootstrap}<div id="root">`);
}
