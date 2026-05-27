import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface WebviewHtmlOptions {
  extensionUri: vscode.Uri;
  webview: vscode.Webview;
  initialRoute: string;
  title: string;
}

export function getWebviewHtml(options: WebviewHtmlOptions): string {
  const distUri = vscode.Uri.joinPath(options.extensionUri, 'dist-webview');
  const distPath = distUri.fsPath;
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    return getFallbackHtml(options.title);
  }

  const nonce = getNonce();
  const cspSource = options.webview.cspSource;
  let html = fs.readFileSync(indexPath, 'utf-8');

  html = html.replace(
    /(<script[^>]*\ssrc=")([^"]+)(")/g,
    (_match: string, prefix: string, src: string, suffix: string) => {
      return `${prefix}${toWebviewUri(options.webview, distUri, src)}${suffix} nonce="${nonce}"`;
    }
  );

  html = html.replace(
    /(<link[^>]*\shref=")([^"]+)(")/g,
    (_match: string, prefix: string, href: string, suffix: string) => {
      return `${prefix}${toWebviewUri(options.webview, distUri, href)}${suffix}`;
    }
  );

  html = html.replace(
    '<head>',
    `<head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${cspSource};">
      <script nonce="${nonce}">window.__WEBVIEW_INITIAL_ROUTE__ = ${JSON.stringify(options.initialRoute)};</script>`
  );

  return html;
}

function toWebviewUri(webview: vscode.Webview, rootUri: vscode.Uri, resourcePath: string): string {
  if (/^https?:\/\//.test(resourcePath)) {
    return resourcePath;
  }

  const normalizedPath = resourcePath.replace(/^\.\//, '');
  return webview.asWebviewUri(vscode.Uri.joinPath(rootUri, normalizedPath)).toString();
}

function getFallbackHtml(title: string): string {
  return `<!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body>
        <div id="root">请先运行 npm run build:webview 构建 Webview</div>
      </body>
    </html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';

  for (let index = 0; index < 32; index += 1) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return text;
}
