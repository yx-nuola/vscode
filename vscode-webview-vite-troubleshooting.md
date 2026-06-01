# VS Code Webview + Vite 打包后页面打不开排查手册

适用场景：

- VS Code 扩展能正常激活
- `panel.webview.html` 写死简单 HTML 可以显示
- 换成 Vite 构建产物后页面打不开或白屏
- 打包过程没有明显报错
- Console 没看到有用错误，或者不确定看的是不是 Webview Console

如果简单 HTML 能显示，说明问题大概率不在命令注册、扩展激活、panel 创建，而在下面几类：

- Vite 产物路径不对
- VSIX 没包含 view 静态资源
- `asWebviewUri` 注入不正确
- `localResourceRoots` 没覆盖资源目录
- CSP 拦截 JS/CSS/worker/font
- 前端 JS 执行后启动失败

## 1. 先确认 Webview 本身能显示

临时写死：

```ts
panel.webview.html = `
  <!DOCTYPE html>
  <html>
    <body>
      <h1>webview loaded</h1>
    </body>
  </html>
`;
```

判断：

```text
能显示：
  扩展激活、命令注册、panel 创建、html 赋值基本没问题

不能显示：
  先查 activationEvents、command 注册、webview provider、main 入口、打包后的 extension.js
```

## 2. 确认 VSIX 里真的包含 View 产物

很多 monorepo 项目开发时能跑，是因为本地目录有 `dist/view`；安装 VSIX 后打不开，是因为 view 产物根本没进包。

执行：

```bash
npx vsce ls
```

或者解压 VSIX：

```bash
unzip your-extension.vsix -d unpacked
```

检查是否存在类似文件：

```text
extension/dist/ext/extension.js
extension/dist/view/index.html
extension/dist/view/assets/index-xxx.js
extension/dist/view/assets/index-xxx.css
```

如果没有 `dist/view`，重点检查：

- `.vscodeignore`
- `package.json` 的 `files` 字段
- `vscode:prepublish`
- `package` script
- monorepo 下 `vsce package` 的执行目录
- Vite `outDir` 是否输出到了扩展包目录内

建议打包前先清理再验证：

```bash
rm -rf dist
npm run package
npx vsce ls
```

如果清理后 view 产物消失，说明打包脚本没有稳定构建 webview。

## 3. 确认运行时代码找的是安装后的路径

VS Code 扩展安装后，`context.extensionUri` 指向的是安装后的扩展包根目录，不是 monorepo 根目录。

推荐基于 `context.extensionUri` 找资源：

```ts
const viewDistUri = vscode.Uri.joinPath(context.extensionUri, 'dist', 'view');
const indexUri = vscode.Uri.joinPath(viewDistUri, 'index.html');
```

避免依赖：

```ts
process.cwd()
__dirname
path.resolve('../../view/dist')
```

这些路径在开发环境可能有效，打包安装后经常失效。

monorepo 常见路径错位：

```text
开发时：
  packages/view/dist

安装后：
  extension/dist/view

代码却还在找：
  packages/view/dist
```

## 4. 直接把读取到的 index.html 显示出来

先确认扩展端真的读到了 Vite 构建后的 `index.html`。

```ts
const indexPath = vscode.Uri.joinPath(
  context.extensionUri,
  'dist',
  'view',
  'index.html'
);

const html = fs.readFileSync(indexPath.fsPath, 'utf8');

panel.webview.html = `
  <!DOCTYPE html>
  <html>
    <body>
      <h2>index.html loaded</h2>
      <pre>${html.replace(/[<>&]/g, ch => {
        return { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[ch]!;
      })}</pre>
    </body>
  </html>
`;
```

期望看到类似：

```html
<script type="module" src="./assets/index-xxx.js"></script>
<link rel="stylesheet" href="./assets/index-xxx.css">
```

如果这里读不到，问题是路径或文件包含，不是前端启动。

## 5. 检查 Vite base 配置

构建后的 `index.html` 资源路径必须是相对路径：

```html
<script type="module" src="./assets/index-xxx.js"></script>
<link rel="stylesheet" href="./assets/index-xxx.css">
```

如果是绝对路径：

```html
<script type="module" src="/assets/index-xxx.js"></script>
<link rel="stylesheet" href="/assets/index-xxx.css">
```

需要配置 Vite：

```ts
export default defineConfig({
  base: './',
});
```

VS Code webview 不是普通站点，`/assets/...` 在 webview 里通常无法正确解析。

## 6. 确认资源路径经过 asWebviewUri

webview 不能直接加载本地文件路径：

```html
<script src="file:///.../dist/view/assets/index.js"></script>
```

应该转换：

```ts
const scriptUri = panel.webview.asWebviewUri(
  vscode.Uri.joinPath(context.extensionUri, 'dist', 'view', 'assets', 'index.js')
);
```

最终 HTML 里应该变成 VS Code webview 可访问的 URI，例如：

```text
vscode-webview-resource://...
```

或新版 VS Code 中类似：

```text
https://file+.vscode-resource.vscode-cdn.net/...
```

建议打印最终 HTML：

```ts
console.log('[webview] extensionUri:', context.extensionUri.toString());
console.log('[webview] indexPath:', indexPath.fsPath);
console.log('[webview] html before:', html);
console.log('[webview] html after:', finalHtml);
```

如果最终 HTML 里还是：

```html
<script src="./assets/index-xxx.js">
```

说明注入替换逻辑没命中。

常见原因：

- 正则只匹配双引号，但 HTML 是单引号
- 属性顺序变化，正则没覆盖
- 只处理了 `<script>`，没处理 `<link>`
- 忘了 `<link rel="modulepreload">`
- 没处理字体、图片、worker、wasm

## 7. 绕过 index.html，手写加载 JS/CSS

这是定位注入问题最快的方法之一。

```ts
const jsUri = panel.webview.asWebviewUri(
  vscode.Uri.joinPath(context.extensionUri, 'dist', 'view', 'assets', 'index-xxx.js')
);

const cssUri = panel.webview.asWebviewUri(
  vscode.Uri.joinPath(context.extensionUri, 'dist', 'view', 'assets', 'index-xxx.css')
);

panel.webview.html = `
  <!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" href="${cssUri}">
    </head>
    <body>
      <h1>before react</h1>
      <div id="root"></div>
      <script type="module" src="${jsUri}"></script>
    </body>
  </html>
`;
```

判断：

```text
before react 显示，React 不显示：
  JS 没执行、CSP 拦截、或者前端启动异常

before react 一闪而过或被替换：
  React 执行了，问题可能在路由或页面渲染

内容有但样式没有：
  CSS 路径、style-src、CSS 内资源路径问题

手写能显示，读取 index.html 不显示：
  index.html 注入/替换逻辑有问题
```

## 8. 检查 localResourceRoots

`asWebviewUri` 指向的本地资源必须在 `localResourceRoots` 允许范围内。

推荐：

```ts
panel.webview.options = {
  enableScripts: true,
  localResourceRoots: [
    vscode.Uri.joinPath(context.extensionUri, 'dist', 'view'),
  ],
};
```

临时排查可以放宽：

```ts
panel.webview.options = {
  enableScripts: true,
  localResourceRoots: [context.extensionUri],
};
```

如果放宽后能显示，说明原来的 `localResourceRoots` 指错了目录。

## 9. 临时放宽 CSP 定位问题

定位阶段可以先放宽 CSP，不要一开始就追求最终安全配置。

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none';
  img-src ${panel.webview.cspSource} https: data:;
  script-src ${panel.webview.cspSource} 'unsafe-inline' 'unsafe-eval';
  style-src ${panel.webview.cspSource} 'unsafe-inline';
  font-src ${panel.webview.cspSource} data:;
  connect-src ${panel.webview.cspSource} https: http:;
  worker-src ${panel.webview.cspSource} blob:;
">
```

如果放宽后能显示，问题就是 CSP。

生产环境再逐步收紧，例如使用 nonce：

```html
<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
```

对应 CSP：

```html
script-src 'nonce-${nonce}';
```

注意：Vite 生成的 `<script type="module">` 也需要 nonce。

## 10. 打开真正的 Webview Developer Tools

普通 VS Code DevTools 不一定能看到 webview 内部错误。

命令面板执行：

```text
Developer: Open Webview Developer Tools
```

重点看 Network：

```text
index-xxx.js 状态码是多少？
index-xxx.css 状态码是多少？
有没有 blocked:csp？
有没有 404？
有没有 ERR_ACCESS_DENIED？
```

重点看 Console：

```text
Refused to load script
Content Security Policy
Failed to load module script
Cannot read properties of undefined
acquireVsCodeApi is not defined
```

判断：

```text
Network 里没有 JS 请求：
  HTML 注入、CSP、script 标签可能有问题

JS 请求 404：
  路径、VSIX 文件包含、asWebviewUri 有问题

JS 请求 ERR_ACCESS_DENIED：
  localResourceRoots 有问题

JS 请求 200，但页面白屏：
  前端运行时、React、Router、初始化逻辑有问题
```

## 11. 在前端入口加硬日志和硬 DOM

在 Vite 前端入口，例如 `main.tsx`，临时加：

```ts
console.log('[webview] main.tsx loaded');

document.body.insertAdjacentHTML(
  'beforeend',
  '<div style="color:red;font-size:20px">main.tsx executed</div>'
);
```

再加 root 检查：

```ts
const root = document.getElementById('root');

console.log('[webview] root:', root);

if (!root) {
  throw new Error('root element not found');
}
```

判断：

```text
看不到 main.tsx executed：
  JS 没加载或没执行

看得到 main.tsx executed，但 React 页面没有：
  React 挂载、路由、App 初始化问题

Console 有 main.tsx loaded：
  JS 已执行，问题进入前端逻辑
```

## 12. 检查 React Router

VS Code webview 里建议使用：

```tsx
<HashRouter>
  <App />
</HashRouter>
```

不建议使用：

```tsx
<BrowserRouter>
  <App />
</BrowserRouter>
```

路径推荐：

```text
#/home
#/detail
```

而不是：

```text
/home
/detail
```

如果使用 `BrowserRouter`，webview 中可能出现路由不匹配、刷新失败或白屏。

## 13. 检查 acquireVsCodeApi

避免在多个模块里重复调用：

```ts
const vscode = acquireVsCodeApi();
```

`acquireVsCodeApi()` 通常只能调用一次，建议封装成单例。

更稳的写法：

```ts
declare const acquireVsCodeApi: (() => unknown) | undefined;

let vscodeApi: unknown;

export function getVSCodeApi() {
  if (!vscodeApi && typeof acquireVsCodeApi === 'function') {
    vscodeApi = acquireVsCodeApi();
  }

  return vscodeApi;
}
```

如果普通浏览器预览也会跑这套代码，需要判断环境：

```ts
const vscode = typeof acquireVsCodeApi === 'function'
  ? acquireVsCodeApi()
  : undefined;
```

## 14. 检查 Vite 动态资源

如果 Vite 输出多个 chunk：

```text
assets/index-aaa.js
assets/vendor-bbb.js
assets/worker-ccc.js
```

确认：

- `base: './'`
- 动态 import 的 chunk 能被相对路径加载
- CSP 允许相关资源
- worker 需要 `worker-src`
- wasm 可能需要额外 CSP 和加载处理

worker 相关 CSP 示例：

```html
worker-src ${panel.webview.cspSource} blob:;
```

## 15. 检查 CSS 内字体和图片

CSS 本身加载成功，不代表 CSS 内部资源成功。

常见资源：

```css
url(/assets/font.woff2)
url(./font.woff2)
url(./image.png)
```

CSP 需要覆盖：

```html
font-src ${panel.webview.cspSource} data:;
img-src ${panel.webview.cspSource} data: https:;
```

这类问题通常不会导致整个页面打不开，但会导致图标、字体、图片缺失。

## 16. 最小定位流程

建议按这个顺序做，不要一次性全改：

```text
1. 写死简单 HTML，确认 webview 能显示
2. 确认 VSIX 里包含 dist/view
3. 直接显示读取到的 index.html
4. 检查 Vite 产物路径是否是 ./assets/...
5. 打印最终 HTML，确认 asWebviewUri 替换成功
6. localResourceRoots 临时放宽到 [context.extensionUri]
7. CSP 临时放宽
8. 手写加载 Vite 的 JS/CSS
9. 打开 Webview Developer Tools 看 Network/Console
10. 前端入口加 main.tsx executed
11. 检查 React Router、acquireVsCodeApi、初始化请求
```

## 17. 快速判断表

```text
简单 HTML 都不显示：
  扩展激活、命令注册、webview 创建、入口 main 有问题

简单 HTML 显示，但 script ok 不显示：
  enableScripts 或 CSP 有问题

script ok 显示，但 Vite 页面不显示：
  JS 路径、asWebviewUri、localResourceRoots、Vite base 有问题

JS/CSS 资源 404：
  VSIX 没包含资源，或运行时路径找错

JS 资源 ERR_ACCESS_DENIED：
  localResourceRoots 没覆盖资源路径

JS 被 Refused to load：
  CSP script-src 或 nonce 有问题

JS 请求 200，但页面白屏：
  React Router、root 挂载、运行时异常、初始化消息有问题

开发能打开，安装 VSIX 后打不开：
  优先怀疑 VSIX 没带 view 产物、路径基于源码目录、prepublish 没构建 view
```

## 18. 优先怀疑项

在 `view` 和 `ext` 分开的 monorepo 里，最常见的是这三个：

```text
1. VSIX 没包含 view 产物
2. 运行时代码找错目录
3. Vite 没配置 base: './'
```

如果这三个都没问题，再查：

```text
4. asWebviewUri 替换逻辑
5. localResourceRoots
6. CSP
7. 前端 React/Router/初始化逻辑
```
