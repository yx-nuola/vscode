# Electron 从小白到能独立开发：学习与实战指南

> 目标：用一份可执行的路线，帮助没有 Electron 经验的前端/TypeScript 开发者，快速理解 Electron 的运行模型，并独立完成一个可打包、可调试、可维护的桌面应用。
>
> 适用人群：会一点 HTML/CSS/JavaScript，或者正在学习 TypeScript、React、Node.js 的开发者。
>
> 资料基线：2026-08-13。Electron、Chromium、Node.js 和构建工具会持续更新；涉及版本、默认值和发布安全的内容，生产开发前应再次查阅官方文档。

---

## 目录

1. [先把 Electron 说清楚](#1-先把-electron-说清楚)
2. [小白需要补齐的基础](#2-小白需要补齐的基础)
   - [2.5 Node.js 基础：Electron 开发的地基](#25-nodejs-基础electron-开发的地基)
3. [最快跑通第一个 Electron 应用](#3-最快跑通第一个-electron-应用)
4. [Electron 的核心：多进程模型](#4-electron-的核心多进程模型)
5. [窗口生命周期和常用 API](#5-窗口生命周期和常用-api)
6. [IPC：让界面和桌面能力安全通信](#6-ipc让界面和桌面能力安全通信)
7. [TypeScript 类型化 IPC](#7-typescript-类型化-ipc)
8. [Renderer 层应该怎样写](#8-renderer-层应该怎样写)
9. [Node.js 与操作系统能力](#9-nodejs-与操作系统能力)
10. [数据持久化、文件和数据库](#10-数据持久化文件和数据库)
11. [Electron 安全：必须形成肌肉记忆](#11-electron-安全必须形成肌肉记忆)
12. [性能：从能运行到好用](#12-性能从能运行到好用)
13. [开发、调试和常见故障排查](#13-开发调试和常见故障排查)
14. [测试、构建和发布](#14-测试构建和发布)
15. [结合当前仓库的学习入口](#15-结合当前仓库的学习入口)
16. [强化知识点与面试式问答](#16-强化知识点与面试式问答)
17. [14 天实战路线](#17-14-天实战路线)
18. [最终能力检查清单](#18-最终能力检查清单)
19. [官方资料](#19-官方资料)

---

## 1. 先把 Electron 说清楚

### 1.1 Electron 是什么

Electron 是一个桌面应用框架。它把三类能力组合在一起：

~~~text
Web 技术：HTML + CSS + JavaScript/TypeScript + React/Vue
                         │
                         ▼
                 Chromium 渲染网页界面
                         │
                         ▼
          Node.js + Electron API 访问桌面能力
~~~

官方可以简单理解为：Electron 把 Chromium 和 Node.js 嵌入应用中，让你用一套 JavaScript 代码开发 Windows、macOS、Linux 桌面应用。最终用户不需要另外安装 Node.js，因为 Electron 自带运行所需的 Node.js 和 Chromium。

### 1.2 Electron 适合什么场景

适合：

- 已经有 Web 前端团队，希望快速做桌面端。
- 需要文件系统、系统通知、托盘、快捷键、窗口管理等桌面能力。
- 工具类、研发类、数据分析类、编辑器类、内部工作台类应用。
- 需要跨平台，但业务界面主要由 Web 技术构成。

不一定适合：

- 极端追求启动速度、内存占用或原生系统体验的应用。
- 大量依赖原生图形 API、音视频底层能力、复杂硬件驱动的应用。
- 只是简单展示一个网页，且不需要本地能力；这类场景用浏览器或 PWA 可能更轻量。

不要把 Electron 理解成“把网页包成 exe”。真正的开发难点是：

1. 理解多进程边界。
2. 设计安全、可维护的 IPC 协议。
3. 管理窗口、数据、文件、权限和异常。
4. 处理开发环境、打包环境和跨平台差异。

### 1.3 一张图记住 Electron

~~~mermaid
flowchart LR
    R["Renderer 渲染进程<br/>React/Vue/HTML/CSS<br/>只负责界面和交互"]
    P["Preload 预加载脚本<br/>contextBridge<br/>暴露最小安全 API"]
    M["Main 主进程<br/>app/BrowserWindow<br/>文件/菜单/系统能力"]
    S["Service 业务服务层<br/>文件、数据库、网络、任务"]
    U["Utility Process<br/>CPU 密集或易崩任务"]
    OS["操作系统"]

    R -->|"window.desktopAPI"| P
    P -->|"ipcRenderer"| M
    M --> S
    M --> OS
    M --> U
    U -->|"MessagePort/IPC"| M
    M -->|"事件推送"| P
    P --> R
~~~

最重要的一句话：**Renderer 是网页，Main 是桌面应用的控制中心，Preload 是两者之间的窄桥。**

### 1.4 四个角色对照表

| 角色 | 运行环境 | 适合做什么 | 不应该做什么 |
| --- | --- | --- | --- |
| Main 主进程 | Node.js + Electron API | 应用生命周期、创建窗口、菜单、托盘、文件、数据库、IPC 路由 | 直接承担长时间 CPU 计算、堆积所有业务逻辑 |
| Renderer 渲染进程 | Chromium 网页环境 | React/Vue/HTML UI、表单、交互、页面状态 | 直接使用 fs、直接加载任意 Node 模块、接触秘密 |
| Preload 预加载脚本 | 受限制的桥接环境 | 将经过筛选的桌面能力暴露给 Renderer | 暴露完整 ipcRenderer、任意命令执行能力 |
| Utility Process | 独立 Node/Electron 子进程 | CPU 密集、易崩、隔离的任务 | 直接操作 UI、绕过主进程协议 |

### 1.5 Electron 和 VS Code 的关系

VS Code 本身就是大型 Electron 应用。VS Code 的扩展运行在 VS Code 扩展宿主中，Webview 又是另一种受限的网页环境；这和“自己开发一个 Electron 应用”不是完全一回事。

当前仓库同时有 VS Code Extension、Webview 和 src/electron，可以把它理解成一个很好的综合练习：

~~~text
VS Code Extension
       │ 进程/消息
       ▼
Electron Main
       │ preload + IPC
       ▼
Electron Renderer（React + Vite）
~~~

学习时要先区分“VS Code API 通信”和“Electron IPC”，再考虑它们之间的转发，不要把所有消息都塞进一个无类型的全局事件总线。

---

## 2. 小白需要补齐的基础

Electron 不要求你一开始就会 C++，但需要你具备一组基础能力。按照下面顺序补齐，学习效率最高。

### 2.1 必备基础

| 基础 | 至少要会什么 | 练习目标 |
| --- | --- | --- |
| HTML | 元素、表单、语义化、事件 | 写一个带输入框和按钮的页面 |
| CSS | 盒模型、Flex、Grid、响应式 | 写一个可伸缩的两栏布局 |
| JavaScript | 模块、对象、数组、Promise、事件 | 实现异步加载和错误提示 |
| TypeScript | 类型、联合类型、泛型、类型收窄、声明文件 | 给 IPC 请求和响应定义类型 |
| Node.js | npm、模块、fs、path、事件循环 | 读写一个 JSON 文件 |
| Git | 分支、提交、回滚、查看差异 | 每完成一个功能就提交一次 |
| 浏览器调试 | Console、Network、Sources、Performance | 能定位白屏、请求失败、性能问题 |

### 2.2 JavaScript 异步必须会

主进程和 Renderer 都是事件驱动的。下面的代码要能读懂：

~~~ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function loadUser(): Promise<Result<{ name: string }>> {
  try {
    const response = await fetch('/api/user');
    if (!response.ok) {
      return { ok: false, error: 'HTTP ' + response.status };
    }
    const data = (await response.json()) as { name: string };
    return { ok: true, data };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}
~~~

在 Electron 中，async/await 不能消除进程边界。它只表示“当前进程中的异步控制流”；Renderer 调用 Main 仍然要经过 IPC。

### 2.3 Node.js 的三个关键点

1. **模块系统**：理解 CommonJS 的 require/module.exports 和 ESM 的 import/export。
2. **路径系统**：不要手写平台分隔符拼接路径，使用 node:path。
3. **事件循环**：不要在 Main 中同步处理大文件、复杂计算或无限循环，否则整个应用会卡顿。

### 2.4 小白学习时的判断标准

你不需要先把所有 API 背下来。每学一个 API，回答四个问题：

1. 它运行在哪个进程？
2. 它是否需要等待 app.whenReady()？
3. 它会不会阻塞当前进程？
4. 它接收的数据是否来自不可信输入？

这四个问题比“这个 API 的参数怎么写”更能决定代码是否可靠。

### 2.5 Node.js 基础：Electron 开发的地基

如果把浏览器 JavaScript 比作“网页里的语言”，Node.js 就是“脱离浏览器运行 JavaScript 的环境”。它提供进程、文件、路径、网络、子进程、流和调试等能力；Electron 的 Main 进程正是运行在 Node.js 环境中。

但要注意：**Node.js 不是一门新语言，而是 JavaScript 运行时；Electron 也不是把所有 Node 能力自动开放给每个页面。**

~~~text
浏览器 Renderer
  window / document / DOM / CSS / Fetch
  默认没有 fs、path、child_process

Electron Main
  app / BrowserWindow / ipcMain
  Node.js：process / fs / path / streams / child_process

Electron Preload
  受限的桥接环境
  通过 contextBridge 暴露最小能力
~~~

本节只讲 Electron 开发最常用的 Node.js 基础。HTTP 服务、Express、Nest 等后端框架不是 Electron 入门的前置条件，可以在需要时单独学习。

#### 2.5.1 运行 Node.js 程序

先确认本机环境：

~~~bash
node --version
npm --version
~~~

运行一个文件：

~~~bash
node scripts/hello.js
~~~

进入交互式 REPL：

~~~bash
node
> 1 + 2
3
> .exit
~~~

Node 程序启动时会先执行入口文件，然后进入事件循环；当没有待处理的异步任务、定时器或打开的资源时，进程才会自然退出。

在 Node 中经常会用到这些全局对象：

| 对象 | 用途 |
| --- | --- |
| process | 读取参数、环境变量、平台、版本和退出状态 |
| console | 输出日志、警告和错误 |
| Buffer | 处理二进制字节 |
| URL | 解析和构造 URL |
| setTimeout/setImmediate | 安排后续任务 |
| globalThis | 当前运行时的全局对象 |

用一个小脚本观察进程信息：

~~~js
console.log({
  arguments: process.argv.slice(2),
  workingDirectory: process.cwd(),
  platform: process.platform,
  nodeVersion: process.version
});
~~~

运行：

~~~bash
node scripts/inspect-process.js one two
~~~

这里的 process.argv 是命令行参数，process.cwd() 是启动命令所在的当前工作目录，process.platform 在 macOS、Windows、Linux 上分别通常是 darwin、win32、linux。当前工作目录可能变化，不要把它当作源码文件所在目录。

#### 2.5.2 npm、package.json 和依赖

一个 Node/Electron 项目的入口通常不是某个神秘的配置，而是 package.json。它描述项目身份、入口、脚本、依赖和版本约束。

常用命令：

~~~bash
npm init -y
npm install electron
npm install --save-dev typescript
npm run build
npm ci
npm exec tsc -- --noEmit
~~~

字段和目录的含义：

| 内容 | 作用 |
| --- | --- |
| package.json | 项目元数据、脚本、依赖声明 |
| package-lock.json | 锁定实际依赖树，保证安装结果更可复现 |
| node_modules | npm 安装的依赖目录，不应提交到 Git |
| dependencies | 应用运行所需要的生产依赖 |
| devDependencies | 本地开发、类型检查、测试、构建所需的依赖 |
| scripts | 可复用的项目命令 |

示例：

~~~json
{
  "name": "desktop-notes",
  "version": "0.1.0",
  "private": true,
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "electron .",
    "check-types": "tsc --noEmit",
    "build": "tsc"
  },
  "dependencies": {
    "electron-store": "^10.0.0"
  },
  "devDependencies": {
    "electron": "^33.4.11",
    "typescript": "^5.9.3"
  }
}
~~~

初学者要记住：

- npm install 会根据 package.json 安装或更新依赖，并可能更新锁文件。
- npm ci 适合 CI 或需要严格复现锁文件的安装，要求 package.json 和锁文件匹配。
- npm run name 会执行 scripts.name，并把 node_modules/.bin 加入脚本环境的 PATH。
- Electron 通常放在 devDependencies 中，由打包工具把 Electron 运行时纳入最终应用。
- 不要随意删除 package-lock.json；依赖版本漂移会让“我这里能运行、别人那里不能运行”。

#### 2.5.3 模块系统：CommonJS 和 ESM

Node.js 常见两套模块写法。

CommonJS：

~~~js
// math.js
function add(a, b) {
  return a + b;
}

module.exports = { add };

// main.js
const { add } = require('./math');
console.log(add(1, 2));
~~~

ESM：

~~~js
// math.mjs
export function add(a, b) {
  return a + b;
}

// main.mjs
import { add } from './math.mjs';
console.log(add(1, 2));
~~~

TypeScript 项目还会根据 tsconfig、package.json 的 type 字段和构建工具决定最终模块格式。当前仓库的 Electron Main 配置使用 CommonJS，而 Renderer 由 Vite 处理，阅读代码时要先看对应的 tsconfig 和 Vite 配置，不要只根据文件扩展名猜测运行方式。

建议：

1. 一个进程的模块风格尽量统一。
2. 导入 Node 内置模块时优先写 node:fs、node:path、node:events 这种带命名空间的形式。
3. 类型导入使用 import type，避免把只在编译期需要的类型打进运行时代码。
4. 不要在 Renderer 中使用 require 绕过 Electron 的安全边界。

#### 2.5.4 异步、事件循环和阻塞

Node.js 默认使用一个 JavaScript 主线程执行代码。它能处理大量并发 I/O，是因为文件、网络等等待工作通常交给操作系统或 Node 的底层线程池，完成后再把回调放回事件循环。

可以把它理解成：

~~~text
JavaScript 主线程
  ├─ 执行当前函数
  ├─ 发起文件/网络异步操作
  ├─ 继续执行后面的 JavaScript
  └─ 事件循环取回完成结果并执行回调
~~~

观察执行顺序：

~~~js
const fs = require('node:fs');

console.log('1. start');

fs.readFile(__filename, 'utf8', (error, content) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log('3. file loaded:', content.length);
});

console.log('2. continue');
~~~

一般先看到 start、continue，再看到 file loaded。异步 I/O 不会让当前 JavaScript 调用栈一直等待。

同步 API 会阻塞当前进程：

~~~js
const fs = require('node:fs');

// 小型启动配置可以谨慎使用；大文件或用户操作中不要这样做。
const content = fs.readFileSync('settings.json', 'utf8');
~~~

在 Electron Main 中阻塞的影响比普通命令行程序更明显：窗口创建、IPC 响应、菜单操作和应用生命周期都可能卡住。

Promise 写法：

~~~js
const { readFile } = require('node:fs/promises');

async function loadText(filePath) {
  const content = await readFile(filePath, 'utf8');
  return content.trim();
}

loadText('notes.txt')
  .then((text) => console.log(text))
  .catch((error) => console.error('读取失败:', error));
~~~

几个容易混淆的点：

- async 函数总是返回 Promise。
- await 只暂停当前 async 函数，不会让整个 Node 进程暂停。
- setTimeout 的时间是“最早可以执行的阈值”，不是精确保证。
- setImmediate 用于安排事件循环后续阶段的任务；不要依赖主模块中 setTimeout(0) 和 setImmediate 的固定先后。
- process.nextTick 的优先级很高，递归使用可能让 I/O 长时间得不到处理；普通让步任务优先考虑 setImmediate。

并发读取多个文件时，Promise.all 很方便：

~~~js
const { readFile } = require('node:fs/promises');

async function readAll(filePaths) {
  return Promise.all(
    filePaths.map((filePath) => readFile(filePath, 'utf8'))
  );
}
~~~

但如果 filePaths 有几万项，瞬间创建大量任务会造成内存和文件描述符压力。真实项目应增加并发上限、分批处理或使用队列。

#### 2.5.5 错误处理：不要让异常穿过边界

Node 错误常见于四个位置：

1. 同步函数直接 throw。
2. Promise reject。
3. 回调的第一个 error 参数。
4. EventEmitter 的 error 事件。

推荐在服务层统一转换错误，在 IPC 层返回稳定结构：

~~~ts
import { readFile } from 'node:fs/promises';

type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

async function readSettings(filePath: string): Promise<ServiceResult<unknown>> {
  try {
    const text = await readFile(filePath, 'utf8');
    return { ok: true, data: JSON.parse(text) };
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String(error.code)
        : 'UNKNOWN';

    return {
      ok: false,
      code,
      message: '设置文件读取失败'
    };
  }
}
~~~

不要把原始错误对象、完整文件路径、Token 或系统环境直接展示给用户；详细错误写入受控日志，UI 展示可理解的提示。

对于异步入口，要显式处理失败：

~~~ts
void startApplication().catch((error: unknown) => {
  console.error('[startup]', error);
  app.quit();
});
~~~

uncaughtException 和 unhandledRejection 适合作为最后一道日志和清理保护，不是让应用在未知状态下继续运行的理由。遇到不可恢复的启动错误时，应记录、提示并安全退出或重启。

#### 2.5.6 path：跨平台处理路径

不要手写路径分隔符：

~~~ts
import path from 'node:path';

const filePath = path.join(appDataPath, 'settings', 'settings.json');
const absolutePath = path.resolve(filePath);
const directory = path.dirname(filePath);
const fileName = path.basename(filePath);
const extension = path.extname(filePath);
~~~

需要分清：

- process.cwd()：启动命令的当前工作目录。
- CommonJS 的 __dirname：当前源文件或编译文件所在目录。
- Electron 的 app.getPath('userData')：适合保存用户配置、缓存和本地数据库。
- app.getAppPath()：应用资源位置，不应该默认认为可写。

路径来自用户输入时，还要防止路径穿越：

~~~ts
const root = path.resolve(workspacePath);
const target = path.resolve(root, userInput);

if (target !== root && !target.startsWith(root + path.sep)) {
  throw new Error('路径超出工作区范围');
}
~~~

仅使用 startsWith 还要注意大小写、符号链接和 Windows 盘符等平台差异；高风险场景需要进一步 realpath 校验和权限策略。

#### 2.5.7 fs：文件系统基础

Node 的文件系统 API 有同步、回调和 Promise 三种风格。Electron 业务代码优先使用 node:fs/promises：

~~~ts
import {
  mkdir,
  readFile,
  rename,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';

async function saveJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });

  const tempPath = filePath + '.tmp';
  const text = JSON.stringify(value, null, 2) + '\n';

  await writeFile(tempPath, text, 'utf8');
  await rename(tempPath, filePath);
}

async function loadJson(filePath: string): Promise<unknown> {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text);
}
~~~

这种“先写临时文件，再重命名”的方式比直接覆盖更能降低写入中断导致的坏文件风险，但多个任务同时写同一文件时仍需要串行队列或锁。

文件服务至少要处理：

- ENOENT：文件或目录不存在。
- EACCES/EPERM：权限不足。
- EISDIR：把目录当成文件读写。
- ENOSPC：磁盘空间不足。
- 文件大小、编码和超时限制。
- 用户取消和窗口关闭后的任务清理。

大文件不要直接 readFile 一次性读入内存，转向 Stream。

#### 2.5.8 process：参数、环境和生命周期

Electron Main 中经常使用：

~~~ts
const isDevelopment = process.env.NODE_ENV === 'development';
const platform = process.platform;
const electronVersion = process.versions.electron;
const nodeVersion = process.versions.node;

console.log({
  isDevelopment,
  platform,
  electronVersion,
  nodeVersion
});
~~~

环境变量都是字符串或 undefined，要自己转换：

~~~ts
function readBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}
~~~

优先设置 process.exitCode，让当前事件循环有机会完成清理；不要在普通业务错误中随意调用 process.exit。Electron 应用退出通常应交给 app.quit、before-quit 和 will-quit 处理。

#### 2.5.9 EventEmitter：Node 世界里的事件

很多 Node API 都是 EventEmitter 或类似事件对象，例如 ChildProcess、部分文件流以及 Electron 的 app、BrowserWindow。

~~~ts
import { EventEmitter } from 'node:events';

class ImportTask extends EventEmitter {
  async run(): Promise<void> {
    this.emit('started');

    try {
      this.emit('progress', { loaded: 0, total: 100 });
      await doWork();
      this.emit('progress', { loaded: 100, total: 100 });
      this.emit('completed');
    } catch (error: unknown) {
      this.emit('error', error);
    }
  }
}

const task = new ImportTask();
const onProgress = (value: { loaded: number; total: number }) => {
  console.log(value);
};

task.on('progress', onProgress);
task.once('completed', () => console.log('done'));
task.on('error', (error) => console.error('failed', error));

void task.run().finally(() => {
  // 任务结束或取消时清理长期监听。
  task.off('progress', onProgress);
});
~~~

注意：

- 事件名和 payload 要形成稳定协议。
- 订阅后必须有对应的 off/removeListener。
- 只需要一次的监听使用 once。
- EventEmitter 的 error 事件必须有处理器，否则可能变成未捕获异常。
- 事件适合推送状态变化；需要返回值的操作使用 Promise 或 IPC invoke/handle。

#### 2.5.10 Buffer、Stream 和背压

字符串是文本，Buffer 是字节。文件、网络、压缩包和音视频通常需要按字节处理：

~~~ts
const bytes = Buffer.from('你好', 'utf8');
console.log(bytes.length);
console.log(Buffer.byteLength('你好', 'utf8'));
console.log(bytes.toString('utf8'));
~~~

不要用 JavaScript 字符串的 length 代替文件字节数。中文、Emoji 和二进制数据都可能让两者不同。

Stream 的价值是“边读边处理”，避免把全部数据一次性放进内存：

~~~ts
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

async function copyLargeFile(source: string, target: string): Promise<void> {
  await pipeline(
    createReadStream(source),
    createWriteStream(target)
  );
}
~~~

当生产者比消费者快时，Stream 的背压机制会让生产者适当放慢。对 Electron 来说，这和 IPC 的分块、ACK、REQUEST_MORE 是同一类问题：**不要无限制地产生数据，要让消费速度参与调度。**

适合使用 Stream 的场景：

- 大文件复制、导入和导出。
- CSV、日志、压缩文件处理。
- 外部命令 stdout/stderr。
- 长时间数据生成。

#### 2.5.11 child_process：调用外部程序

Electron 工具可能需要调用 Git、FFmpeg、Python 或系统命令。优先使用 spawn 或 execFile，并把可执行文件和参数分开：

~~~ts
import { spawn } from 'node:child_process';

function runTool(executable: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    child.stdout.on('data', (chunk) => {
      console.log('[tool:stdout]', chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
      console.error('[tool:stderr]', chunk.toString());
    });

    child.once('error', reject);
    child.once('close', (code) => {
      if (code === 0) resolve(0);
      else reject(new Error('工具退出码：' + String(code)));
    });
  });
}
~~~

不要把用户输入拼接成 shell 字符串：

~~~ts
// ❌ 容易产生命令注入和转义问题
exec('ffmpeg -i ' + userInput);

// ✅ 可执行文件固定，参数作为数组传递
spawn('ffmpeg', ['-i', inputPath, outputPath]);
~~~

工程要求：

- 只允许调用明确的可执行文件或应用内置工具。
- 对输入路径、输出路径和参数做 allowlist、长度和格式校验。
- 设置超时、取消、最大输出量和退出码处理。
- 监听 error、close，并在窗口关闭时终止子进程。
- 不在 Renderer 直接调用 child_process，必须走 Main/Preload。

同步的 spawnSync、execSync、execFileSync 会阻塞事件循环，只适合非常明确的启动脚本或小型工具，不适合用户点击后执行的长任务。

#### 2.5.12 Worker、Utility Process 和任务隔离

Node.js 生态里有几种“把任务移出当前 JavaScript 线程”的方式：

| 任务特点 | 选择 |
| --- | --- |
| 纯计算，数据可以在 Web 环境处理 | Renderer 的 Web Worker |
| 纯 Node 计算，希望共享进程资源 | node:worker_threads |
| Node 任务可能崩溃或需要更强隔离 | Electron Utility Process |
| 调用外部软件 | node:child_process |

判断依据不是“哪个 API 更高级”，而是：

1. 任务是否需要 Electron API？
2. 任务是否会阻塞 CPU？
3. 任务失败后是否允许拖垮 Main？
4. 是否需要流式进度、取消和重试？

在 Electron 中，UI 只关心任务状态；任务执行器、取消和资源释放都放在 Main 的服务层或独立进程里。

#### 2.5.13 Node 调试方法

命令行调试：

~~~bash
node --inspect-brk scripts/inspect-process.js
~~~

然后用 Chrome DevTools 或 VS Code 附加 Node 调试器。常用调试手段：

- 在关键边界打印结构化日志，而不是到处打印字符串。
- 日志包含任务 ID、窗口 ID、IPC channel 和耗时。
- 用 Error.stack 保留调用栈。
- 用 node --trace-warnings 追查运行时警告。
- 用断点检查 Main、Preload 和 Renderer 是否拿到了同一份数据。
- 生产环境避免输出 Token、密码、完整用户路径和大块原始数据。

Electron 的 Main 进程可以用 Node 调试方式附加，Renderer 则使用 Chromium DevTools；两边日志不要混为一谈。

#### 2.5.14 Node.js 能力如何映射到 Electron

| Node.js 基础 | Electron 中的实际落点 |
| --- | --- |
| process | 应用平台、版本、环境变量和启动参数 |
| path | preload、Renderer 产物、userData 和资源路径 |
| fs/promises | 设置、布局、文件导入导出 |
| Buffer | 二进制文件和分块数据 |
| Stream | 大文件和外部命令输出 |
| EventEmitter | app、窗口、子进程、任务进度 |
| child_process | Git、FFmpeg、Python 等外部工具 |
| worker_threads/Utility Process | CPU 密集、易崩或可隔离任务 |
| npm/package.json | 开发脚本、依赖、构建和打包入口 |

可以用一句话记忆：

~~~text
Node.js 提供 Main 的执行能力，
Electron 提供桌面生命周期和窗口能力，
Preload/IPC 决定这些能力如何安全到达界面。
~~~

#### 2.5.15 Node.js 基础实战练习

按难度完成，不要只阅读：

1. **命令行参数练习**：写 scripts/inspect-process.js，打印参数、当前目录、平台和 Node 版本。
2. **配置服务练习**：使用 fs/promises 在临时目录创建、读取、原子更新 settings.json。
3. **路径安全练习**：实现只允许访问 workspacePath 内部文件的 resolveSafePath。
4. **事件任务练习**：实现带 started、progress、completed、cancelled、error 事件的 ImportTask。
5. **Stream 练习**：复制一个大文本文件，并统计字节数、行数和处理耗时。
6. **子进程练习**：调用一个固定的 Node 脚本，收集 stdout、stderr、退出码和取消状态。
7. **Electron 练习**：把第 2 个配置服务通过 ipcMain.handle 暴露给 Renderer，并补充参数校验。

完成标准：

- 正常路径有结果。
- 文件不存在、权限不足、输入不合法时有稳定错误。
- 长任务可以取消。
- 监听器、文件句柄和子进程都能清理。
- 运行过程不会阻塞 Electron 窗口。

---

## 3. 最快跑通第一个 Electron 应用

下面先用原生 JavaScript 跑通最小闭环，再把相同结构迁移到 TypeScript/React。这样可以避免一开始同时被 Electron、Vite、React、TypeScript 配置分散注意力。

### 3.1 创建项目

~~~bash
mkdir electron-quickstart
cd electron-quickstart
npm init -y
npm install --save-dev electron
mkdir renderer
~~~

Electron 官方教程建议将 Electron 安装在 devDependencies。原因是打包时会将 Electron 运行时一起处理，最终用户不需要单独安装 Node.js。

修改 package.json：

~~~json
{
  "name": "electron-quickstart",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "devDependencies": {
    "electron": "你的项目锁定版本"
  }
}
~~~

开发机上的 Node.js 主要用于安装依赖、运行脚手架和构建工具；应用运行时使用 Electron 自带的 Node.js。正式项目要提交锁文件，并在升级 Electron 时阅读 Breaking Changes。

### 3.2 主进程：创建窗口

新建 main.js：

~~~js
const { app, BrowserWindow } = require('electron/main');
const path = require('node:path');

function createWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  window.loadFile(path.join(__dirname, 'renderer/index.html'));

  window.once('ready-to-show', () => {
    window.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  // macOS 常见行为：应用仍在运行，但没有窗口时，点击 Dock 重新创建窗口。
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Windows/Linux 通常在最后一个窗口关闭后退出；macOS 通常保留应用进程。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
~~~

这里有四个初学者必须理解的点：

- app.whenReady()：窗口创建依赖 Electron 初始化完成。
- BrowserWindow：一个窗口对应一个 Renderer 进程。
- preload：在页面加载前运行的桥接脚本。
- ready-to-show：页面第一次完成渲染后再显示，减少白屏闪烁。

### 3.3 Renderer：一个最小页面

新建 renderer/index.html：

~~~html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Electron 入门应用</title>
  </head>
  <body>
    <main>
      <h1>我的第一个 Electron 应用</h1>
      <label>
        应用名称
        <input id="name-input" value="Electron" />
      </label>
      <button id="save-button" type="button">保存</button>
      <p id="status"></p>
    </main>
    <script src="./renderer.js"></script>
  </body>
</html>
~~~

新建 renderer/renderer.js：

~~~js
const input = document.querySelector('#name-input');
const button = document.querySelector('#save-button');
const status = document.querySelector('#status');

button.addEventListener('click', async () => {
  const name = input.value.trim();
  if (!name) {
    status.textContent = '请输入名称';
    return;
  }

  const result = await window.desktopAPI.saveName(name);
  status.textContent = result.ok ? '已保存：' + result.data : result.error;
});
~~~

此时还缺少 desktopAPI。这正好用来学习 Preload 和 IPC。

### 3.4 Preload：只暴露一个能力

新建 preload.js：

~~~js
const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('desktopAPI', {
  saveName: (name) => ipcRenderer.invoke('settings:save-name', name)
});
~~~

不要这样写：

~~~js
// ❌ 不要把完整 ipcRenderer 暴露给页面
contextBridge.exposeInMainWorld('electron', { ipcRenderer });
~~~

正确的思路是：一个业务能力对应一个明确方法，参数在 Main 中再次校验。

### 3.5 Main：注册 IPC Handler

在 main.js 顶部增加 ipcMain，并注册 Handler：

~~~js
const { app, BrowserWindow, ipcMain } = require('electron/main');

ipcMain.handle('settings:save-name', (event, rawName) => {
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  if (!name || name.length > 100) {
    return { ok: false, error: '名称必须是 1 到 100 个字符' };
  }

  // 真实项目中，这里可以调用 settingsService.saveName(name)。
  return { ok: true, data: name };
});
~~~

运行：

~~~bash
npm start
~~~

### 3.6 第一个练习

在这个最小项目上依次增加：

1. loadName：启动时从 Main 获取已保存名称。
2. dialog:open-file：点击按钮打开系统文件选择框。
3. shell:open-external：只允许打开 HTTPS 链接。
4. app:get-version：从 Main 返回应用版本。
5. window:set-title：由 Renderer 修改窗口标题，但不能允许任意窗口被修改。

每增加一个功能，都写下：调用方、IPC channel、参数类型、返回类型、错误处理、权限边界。

---

## 4. Electron 的核心：多进程模型

### 4.1 Main 主进程

每个 Electron 应用通常有一个 Main 进程。它负责：

- 应用生命周期：启动、退出、单实例、升级。
- 窗口：创建、销毁、显示、隐藏、窗口状态。
- 原生能力：菜单、托盘、通知、快捷键、系统对话框。
- 受保护的数据：文件系统、数据库、凭证、密钥访问。
- IPC 路由和业务服务编排。

Main 有 Node.js 能力，但这不意味着所有代码都应该放在 Main。Main 被阻塞时，窗口创建、IPC 响应和应用生命周期都会受到影响。

### 4.2 Renderer 渲染进程

每个 BrowserWindow 都会创建自己的 Renderer 进程。Renderer 主要就是一个 Chromium 网页：

- 可以使用 DOM、CSS、Fetch、Canvas、Web Worker 等 Web API。
- 可以使用 React/Vue/Svelte 等 UI 框架。
- 默认不能直接使用 Node.js 或 Electron 模块。
- 不应该保存密钥、数据库句柄或任意系统命令能力。

多个窗口之间默认也不是共享的全局 JavaScript 环境。需要共享状态时，应通过 Main 服务、持久化存储或显式 IPC 传递。

### 4.3 Preload 预加载脚本

Preload 在 Renderer 页面脚本之前执行，承担“能力适配器”的角色：

~~~text
页面按钮
  ↓
window.desktopAPI.openFile()
  ↓
preload 中的 ipcRenderer.invoke('file:open')
  ↓
Main 中的 ipcMain.handle('file:open')
  ↓
dialog.showOpenDialog()
~~~

Preload 不是业务层，也不是一个“万能后门”。它应当：

- 只暴露经过设计的 API。
- 只做参数适配和事件订阅清理。
- 不把整个 Electron/Node API 对象挂到 window。
- 让 Renderer 的 TypeScript 能知道 API 形状。

### 4.4 Utility Process

当任务 CPU 密集、运行时间长、依赖不稳定，或者不希望它崩溃时拖垮 Main，可以考虑 Utility Process、Node Worker 或 Web Worker。

| 任务 | 优先选择 |
| --- | --- |
| 计算少、需要桌面 API | Main 中的异步服务 |
| 纯计算、数据解析、不会访问 Electron API | Web Worker |
| Node.js 生态任务、可能崩溃、需要独立进程 | Utility Process |
| 需要启动外部程序 | child_process，并严格固定命令和参数 |

### 4.5 进程边界的设计原则

把 Electron 应用分成三层：

~~~text
UI 层：展示状态、收集输入、触发命令
    ↓
IPC 层：协议、验证、序列化、权限
    ↓
Domain/Service 层：文件、数据库、网络、计算和业务规则
~~~

不要让 Button 的点击处理器直接拼接文件路径，也不要让 ipcMain.handle 内部塞进几百行业务逻辑。IPC Handler 应该像 HTTP Controller：验证请求、调用服务、返回结果。

---

## 5. 窗口生命周期和常用 API

### 5.1 常见生命周期

~~~text
进程启动
  │
  ├─ app.whenReady()
  │      │
  │      └─ new BrowserWindow()
  │              │
  │              ├─ loadFile/loadURL
  │              ├─ ready-to-show
  │              └─ did-finish-load
  │
  ├─ 用户关闭窗口
  │      └─ close/closed
  │
  └─ window-all-closed / before-quit / will-quit / quit
~~~

### 5.2 app.whenReady() 和 ready

很多 Electron API 只有在应用完成初始化后才能安全调用。初学时统一使用：

~~~ts
app.whenReady().then(() => {
  createMainWindow();
});
~~~

不要在模块加载阶段就创建 BrowserWindow。如果确实需要在 ready 前调用某些 API，必须先确认该 API 的生命周期要求。

### 5.3 macOS 与 Windows/Linux 的差异

- Windows/Linux：最后一个窗口关闭后，通常退出应用。
- macOS：关闭最后一个窗口后，应用通常仍在运行；点击 Dock 时再创建窗口。
- 快捷键、菜单、托盘、窗口按钮、文件打开事件，都存在平台差异。
- 不要只在 macOS 开发机上验证窗口关闭和应用退出逻辑。

### 5.4 窗口管理器

多窗口应用建议集中管理窗口：

~~~ts
class WindowManager {
  private readonly windows = new Map<string, BrowserWindow>();

  get(id: string): BrowserWindow | undefined {
    const window = this.windows.get(id);
    if (!window || window.isDestroyed()) {
      this.windows.delete(id);
      return undefined;
    }
    return window;
  }

  set(id: string, window: BrowserWindow): void {
    this.windows.set(id, window);
    window.once('closed', () => {
      this.windows.delete(id);
    });
  }
}
~~~

实际项目还需要考虑：

- 是否允许同一类型窗口重复打开。
- 窗口状态保存在哪里。
- 关闭窗口是销毁还是隐藏到托盘。
- 父子窗口、模态窗口和多显示器坐标。
- 页面加载失败时是否重试或展示错误页。

---

## 6. IPC：让界面和桌面能力安全通信

IPC 是 Electron 开发最重要的工程能力之一。Main 和 Renderer 职责不同，界面想调用桌面能力时，需要通过 IPC 传递消息。

### 6.1 四种常用模式

| 需求 | Renderer 侧 | Main 侧 | 返回值 |
| --- | --- | --- | --- |
| 发通知，不等待结果 | ipcRenderer.send | ipcMain.on | 无 Promise 返回 |
| 请求并等待结果 | ipcRenderer.invoke | ipcMain.handle | Promise |
| Main 主动推送事件 | ipcRenderer.on | webContents.send | 事件回调 |
| 大量/持续数据 | MessagePort、分块协议 | 对应端口或路由 | 需要背压和取消 |

优先使用 invoke/handle 表达“请求-响应”，使用 send/on 表达“命令或通知”。不要让一个 channel 同时承担请求、进度、错误和取消的所有语义。

### 6.2 channel 命名

建议使用“领域:动作”命名：

~~~text
settings:load
settings:save
file:open
file:export
window:set-title
workspace:list
workspace:watch-start
workspace:watch-stop
~~~

避免：

~~~text
message
data
event
doSomething
~~~

好的 channel 名能帮助你快速知道：谁调用、做什么、是不是请求响应。

### 6.3 IPC 数据必须可序列化

IPC 传输的数据应尽量是明确的 JSON-like 数据：

~~~ts
type FileOpenResult =
  | { ok: true; filePath: string; content: string }
  | { ok: false; code: 'CANCELLED' | 'READ_FAILED'; message: string };
~~~

不要直接跨 IPC 传递：

- 大型循环引用对象。
- 数据库连接、文件句柄、窗口实例。
- 带复杂原型的类实例。
- 不受控的函数。
- 没有上限的任意二进制数据。

二进制数据可以使用 ArrayBuffer、MessagePort 或分块协议，但要提前设计大小限制、顺序、重试、取消和背压。

### 6.4 请求-响应的推荐流程

~~~text
Renderer
  1. 收集并做基础校验
  2. 调用 window.desktopAPI.fileOpen()
        │
Preload 3. invoke('file:open', safeArgs)
        │
Main
  4. 校验 sender 和参数
  5. 调用 fileService.open()
  6. 将异常转成稳定错误结构
        │
Preload 7. 返回 Promise
        │
Renderer 8. 更新 loading/success/error 状态
~~~

### 6.5 事件订阅一定要能清理

Preload：

~~~ts
function onMessage(callback: (message: unknown) => void): () => void {
  const listener = (_event: unknown, message: unknown) => {
    callback(message);
  };

  ipcRenderer.on('workspace:message', listener);

  return () => {
    ipcRenderer.removeListener('workspace:message', listener);
  };
}
~~~

Renderer：

~~~ts
useEffect(() => {
  const dispose = window.desktopAPI.onWorkspaceMessage((message) => {
    dispatch({ type: 'message-received', message });
  });

  return dispose;
}, []);
~~~

不要在每次 React 渲染时重复 ipcRenderer.on，也不要用 removeAllListeners 粗暴清理其他模块注册的监听器。

---

## 7. TypeScript 类型化 IPC

无类型 IPC 是 Electron 项目变乱的主要原因之一。推荐让“共享协议类型”和“实现”分离。

### 7.1 共享协议

~~~ts
// shared/ipc-contract.ts
export type IpcResult<T, C extends string = string> =
  | { ok: true; data: T }
  | { ok: false; code: C; message: string };

export interface SettingsAPI {
  load(): Promise<IpcResult<{ name: string }>>;
  saveName(name: string): Promise<IpcResult<string, 'INVALID_NAME'>>;
}

export interface WorkspaceAPI {
  openFolder(): Promise<IpcResult<string | null, 'CANCELLED' | 'OPEN_FAILED'>>;
  onProgress(callback: (progress: { loaded: number; total: number }) => void): () => void;
}

export interface DesktopAPI {
  settings: SettingsAPI;
  workspace: WorkspaceAPI;
}
~~~

### 7.2 Preload 实现

~~~ts
// preload/index.ts
import { contextBridge, ipcRenderer } from 'electron/renderer';
import type { DesktopAPI } from '../shared/ipc-contract';

const desktopAPI: DesktopAPI = {
  settings: {
    load: () => ipcRenderer.invoke('settings:load'),
    saveName: (name) => ipcRenderer.invoke('settings:save-name', name)
  },
  workspace: {
    openFolder: () => ipcRenderer.invoke('workspace:open-folder'),
    onProgress: (callback) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        progress: { loaded: number; total: number }
      ) => callback(progress);

      ipcRenderer.on('workspace:progress', listener);
      return () => ipcRenderer.removeListener('workspace:progress', listener);
    }
  }
};

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI);
~~~

### 7.3 Renderer 类型声明

~~~ts
// renderer/types/global.d.ts
import type { DesktopAPI } from '../../shared/ipc-contract';

declare global {
  interface Window {
    desktopAPI: DesktopAPI;
  }
}

export {};
~~~

### 7.4 Main 注册 Handler

~~~ts
// main/ipc/settings-handlers.ts
import { ipcMain } from 'electron/main';
import type { IpcMainInvokeEvent } from 'electron';

function isTrustedRenderer(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame;
  if (!frame || frame !== event.sender.mainFrame) {
    return false;
  }

  // 真实项目中根据加载策略选择 allowlist。
  return frame.url.startsWith('file://') || frame.url.startsWith('app://');
}

ipcMain.handle('settings:save-name', (event, rawName: unknown) => {
  if (!isTrustedRenderer(event)) {
    return {
      ok: false,
      code: 'UNTRUSTED_SENDER',
      message: '不受信任的渲染来源'
    };
  }

  if (typeof rawName !== 'string') {
    return {
      ok: false,
      code: 'INVALID_NAME',
      message: '名称必须是字符串'
    };
  }

  const name = rawName.trim();
  if (name.length === 0 || name.length > 100) {
    return {
      ok: false,
      code: 'INVALID_NAME',
      message: '名称长度必须在 1 到 100 个字符之间'
    };
  }

  return { ok: true, data: name };
});
~~~

上面的类型示例表达了三个工程原则：

1. Renderer 不需要知道 ipcRenderer 的存在。
2. Main 不相信 Renderer 传来的参数。
3. 成功和失败都形成稳定的返回结构，UI 才能可靠展示状态。

### 7.5 类型收窄要真正运行时验证

TypeScript 类型只在编译阶段存在。来自 IPC、文件、网络和用户输入的数据运行时仍然可能是错的。生产项目可使用手写 type guard、Zod 或其他 schema 校验库：

~~~ts
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
~~~

原则是：**边界校验一次，内部服务使用可信类型。**

---

## 8. Renderer 层应该怎样写

### 8.1 Renderer 的职责

Renderer 应该专注于：

- UI 展示和交互。
- 表单状态和页面状态。
- 调用经过封装的 window.desktopAPI。
- loading、empty、error、success 状态。
- 页面级性能优化。

Renderer 不应该负责：

- 拼接系统路径。
- 执行任意系统命令。
- 直接打开数据库连接。
- 把 IPC channel 字符串散落在几十个组件里。
- 通过 window.require 绕过安全边界。

### 8.2 推荐目录

~~~text
src/
├── main/
│   ├── index.ts
│   ├── windows/
│   ├── ipc/
│   └── services/
├── preload/
│   └── index.ts
├── renderer/
│   ├── App.tsx
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── stores/
│   └── types/
└── shared/
    ├── ipc-contract.ts
    └── domain-types.ts
~~~

### 8.3 页面状态机

不要只用一个 isLoading 管理复杂页面。至少考虑：

~~~ts
type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };
~~~

对于桌面工具，还经常需要：

- cancelled：用户取消文件选择或任务。
- partial：分块数据只接收了一部分。
- stale：页面数据已经不是最新版本。
- offline：网络服务不可用，但本地功能仍可用。

### 8.4 Renderer 和 Main 的状态边界

| 状态 | 适合放哪里 |
| --- | --- |
| 输入框当前值 | Renderer |
| 当前选中的 Tab | Renderer，必要时持久化 |
| 用户偏好、窗口布局 | Main 服务 + 持久化，Renderer 缓存 |
| 文件内容 | Main 读取，Renderer 展示或编辑副本 |
| 数据库连接 | Main |
| 任务进度 | Main 产生，Renderer 订阅 |
| 登录凭证/密钥 | Main 的安全存储，Renderer 只能请求能力 |

### 8.5 React 中的 IPC 使用方式

~~~tsx
function SettingsPage() {
  const [state, setState] = useState<LoadState<{ name: string }>>({
    status: 'loading'
  });

  useEffect(() => {
    let active = true;

    window.desktopAPI.settings.load().then((result) => {
      if (!active) return;
      setState(
        result.ok
          ? { status: 'success', data: result.data }
          : { status: 'error', message: result.message }
      );
    });

    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') return <p>加载中...</p>;
  if (state.status === 'error') return <p>{state.message}</p>;
  if (state.status === 'idle') return null;

  return <p>当前名称：{state.data.name}</p>;
}
~~~

这里的 active 是防止组件卸载后异步结果继续更新状态的简单方式。更复杂的任务应在 IPC 协议中加入取消操作。

---

## 9. Node.js 与操作系统能力

### 9.1 常用 Electron API

| 能力 | API 方向 | 典型用途 |
| --- | --- | --- |
| 应用生命周期 | app | 启动、退出、应用路径、单实例 |
| 窗口 | BrowserWindow | 创建、显示、隐藏、加载页面 |
| 系统对话框 | dialog | 打开文件、保存文件、错误提示 |
| 菜单 | Menu | 应用菜单、右键菜单 |
| 托盘 | Tray | 后台驻留、快捷操作 |
| 系统通知 | Notification | 任务完成、提醒 |
| 外部链接 | shell | 浏览器打开可信 URL |
| 全局快捷键 | globalShortcut | 全局命令 |
| 剪贴板 | clipboard | 复制、粘贴 |
| 会话 | session | 权限、请求拦截、缓存、CSP |
| 自定义协议 | protocol | 更可控的本地资源加载 |

### 9.2 文件路径的正确做法

~~~ts
import { app } from 'electron/main';
import path from 'node:path';

const settingsPath = path.join(app.getPath('userData'), 'settings.json');
~~~

常用路径：

- app.getPath('userData')：用户数据、配置、缓存数据库。
- app.getPath('documents')：用户文档目录。
- app.getPath('downloads')：用户下载目录。
- app.getPath('logs')：应用日志目录。
- app.getAppPath()：应用资源根目录；不要把它当作可写目录。

不要把用户数据写到：

- 当前工作目录。
- 项目源码目录。
- resources 或打包后的只读资源目录。
- 通过用户输入直接拼接出来的任意路径。

### 9.3 文件操作的安全边界

~~~ts
import { promises as fs } from 'node:fs';

async function readTextFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf8');
  if (content.length > 10 * 1024 * 1024) {
    throw new Error('文件超过 10 MB 限制');
  }
  return content;
}
~~~

真实项目还应考虑：

- 文件不存在、权限不足、编码不兼容。
- 符号链接和路径穿越。
- 同一文件并发读写。
- 原子写入：先写临时文件，再重命名。
- 大文件改用流，不要一次性读入内存。

### 9.4 外部命令

如果必须调用 ffmpeg、Git 或其他系统程序：

- 固定可执行文件来源。
- 使用参数数组，不要把用户输入拼成 shell 字符串。
- 设置超时、退出码、标准输出和标准错误处理。
- 允许用户取消进程。
- 清晰展示权限和失败原因。

---

## 10. 数据持久化、文件和数据库

### 10.1 存储方式选择

| 数据规模/性质 | 推荐 | 说明 |
| --- | --- | --- |
| 少量偏好设置 | JSON 文件或 electron-store | 简单，适合主题、窗口布局 |
| 多表关系、查询、事务 | SQLite | 适合离线工具和业务数据 |
| 大文件原文 | 文件系统 | 数据库只保存索引和元数据 |
| 多端同步数据 | 远程服务 | Electron 只负责本地缓存和离线策略 |
| 敏感凭证 | 系统安全存储 | 不要明文放在 Renderer 或 JSON 中 |

### 10.2 JSON 设置的基本结构

~~~ts
interface AppSettingsV1 {
  version: 1;
  theme: 'light' | 'dark' | 'system';
  window: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
}
~~~

一定要有 version。因为应用升级后，旧配置仍然存在，需要迁移：

~~~ts
function migrateSettings(raw: unknown): AppSettingsV1 {
  if (!raw || typeof raw !== 'object') {
    return createDefaultSettings();
  }

  const candidate = raw as Partial<AppSettingsV1>;
  if (candidate.version === 1) {
    return normalizeSettings(candidate);
  }

  return createDefaultSettings();
}
~~~

### 10.3 窗口布局保存

窗口位置可能在用户切换显示器后失效。保存和恢复时应检查：

- 坐标是否仍在可见屏幕范围。
- 当前显示器是否存在。
- 宽高是否超过当前屏幕。
- 多窗口是否冲突。

### 10.4 数据库连接放在哪里

数据库连接和迁移应该只在 Main 中管理：

~~~text
Renderer：queryUsers({ keyword })
   ↓ IPC
Main：校验参数
   ↓
UserRepository：执行查询
   ↓
Main：返回 DTO，不返回连接对象
~~~

Renderer 只拿 DTO，不拿数据库驱动实例。这样既安全，也便于测试。

---

## 11. Electron 安全：必须形成肌肉记忆

Electron 让 JavaScript 具备文件系统和系统命令能力，因此网页中的 XSS、依赖投毒、远程内容被篡改，可能直接升级成桌面代码执行风险。

### 11.1 基础安全配置

本地页面通常至少从下面的配置开始：

~~~ts
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true
}
~~~

注意：配置不是万能的。安全要和加载内容、依赖、IPC 设计、导航策略一起评估。

### 11.2 安全检查清单

- [ ] 只加载可信的本地内容或 HTTPS 内容。
- [ ] 不给远程页面开启 Node.js 集成。
- [ ] 开启 contextIsolation。
- [ ] 开启 Renderer sandbox，除非确有明确理由并记录风险。
- [ ] 不把完整 ipcRenderer、remote 或 Node API 暴露给页面。
- [ ] 每个 IPC Handler 都校验 sender、参数和权限。
- [ ] 对 iframe、弹窗、新窗口和导航设置 allowlist。
- [ ] 对 shell.openExternal 的 URL 做协议和域名校验。
- [ ] 使用限制性的 CSP，避免无理由使用 unsafe-eval。
- [ ] 不关闭 webSecurity。
- [ ] 不把密钥放到 Renderer、前端 bundle、日志或明文配置中。
- [ ] 定期升级 Electron、Node/Chromium 和第三方依赖。
- [ ] 打包发布时做代码签名和完整性保护。
- [ ] 对导入文件、外部命令、网络响应设定大小和时间限制。
- [ ] 安全错误不能把敏感路径、Token 和系统信息直接展示给用户。

### 11.3 为什么不能暴露通用发送函数

危险设计：

~~~ts
// ❌ 页面可以发送任何 channel，权限边界失控
contextBridge.exposeInMainWorld('api', {
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  }
});
~~~

安全设计：

~~~ts
// ✅ 每个能力有明确名称和参数
contextBridge.exposeInMainWorld('api', {
  saveSettings: (settings: PublicSettings) =>
    ipcRenderer.invoke('settings:save', settings),
  openFolder: () => ipcRenderer.invoke('workspace:open-folder')
});
~~~

### 11.4 当前仓库的安全强化练习

当前仓库的 Electron 代码已经体现了几个值得学习的点：

- src/electron/main/index.ts 使用了 nodeIntegration: false、contextIsolation: true、webSecurity: true。
- src/electron/preload/index.ts 通过 contextBridge.exposeInMainWorld 暴露 electronAPI。
- 主进程、预加载脚本和 React Renderer 已经分目录组织。

同时，它也适合作为强化练习：

1. 评估 sandbox: false 是否真的必要；如果不是，恢复为安全默认值。
2. 收紧 CSP，特别是审查 unsafe-eval 和 unsafe-inline 是否由开发工具引入。
3. 为 load-layout、save-layout、消息转发等 Handler 增加 sender allowlist 和参数 schema 校验。
4. 去掉 @ts-nocheck，使用 Electron 官方的 electron/main、electron/renderer 类型入口。
5. 将 IPC channel 和消息结构从字符串散落改成共享的 discriminated union 类型。
6. 不使用进程内 Map 作为最终持久化方案，改为带版本迁移的存储服务。

这些是学习和改造建议，本次文档生成没有修改现有源代码。

---

## 12. 性能：从能运行到好用

### 12.1 Main 不要被阻塞

以下代码在大文件场景下可能阻塞 Main：

~~~ts
// ❌ 大文件同步读取会阻塞当前进程
const content = fs.readFileSync(filePath, 'utf8');
~~~

优先使用异步 API 或流：

~~~ts
const content = await fs.promises.readFile(filePath, 'utf8');
~~~

如果解析本身很重：

- 分块处理。
- 用 Web Worker 处理纯计算。
- 用 Utility Process 隔离 Node 任务。
- 设计可取消任务。

### 12.2 IPC 不是无限吞吐管道

大数据通过 IPC 传输时要考虑：

- 结构化克隆成本。
- JSON 序列化和反序列化成本。
- 内存峰值。
- Main、Renderer 和消费者速度不一致。
- 任务取消和窗口关闭后的清理。

推荐的分块模型：

~~~text
请求任务
  ↓
Main 读取/生成 chunk 0
  ↓
Renderer 消费 chunk 0
  ↓ ACK / REQUEST_MORE
Main 再发送 chunk 1
  ↓
完成 / 取消 / 错误
~~~

不要一上来就把几百 MB 数据一次性 webContents.send 给页面。

### 12.3 Renderer 优化

- 大列表使用虚拟滚动。
- 图表只在可见区域渲染。
- 避免每个单元格都创建独立复杂组件。
- 大量数据使用批量更新。
- 不在 React render 中做解析和文件读取。
- 监听窗口 resize 时使用节流。
- 通过 Performance 面板确认瓶颈，不要凭感觉优化。

### 12.4 启动性能

- Main 启动阶段只做必要初始化。
- 数据库迁移、索引建立、插件扫描放到后台任务。
- 页面使用骨架屏或渐进式加载。
- 对 ready-to-show 和首屏渲染时间分别测量。
- 避免在 preload 中加载一大批与当前窗口无关的模块。

---

## 13. 开发、调试和常见故障排查

### 13.1 先判断错误来自哪个进程

~~~text
Main 问题：看启动终端、Main 调试器、Electron 主进程日志
Preload 问题：看 Renderer DevTools 的 preload 错误和加载路径
Renderer 问题：看 Chromium DevTools 的 Console/Network/Sources
打包问题：解包产物，检查 main、preload、renderer 文件是否都存在
~~~

### 13.2 调试顺序

1. 确认 package.json 的 main 指向真实存在的入口。
2. 确认 Main 是否成功启动。
3. 确认 BrowserWindow 是否创建。
4. 确认 preload 的绝对路径和编译产物存在。
5. 确认 loadURL 的开发服务器端口或 loadFile 的路径。
6. 打开 Renderer DevTools 看首个错误。
7. 再检查 IPC channel、参数和 Handler 注册时机。

### 13.3 常见问题表

| 现象 | 常见原因 | 排查方向 |
| --- | --- | --- |
| require is not defined | 在 Renderer 直接使用 Node API | 移到 Main/Preload，通过桥接调用 |
| window.desktopAPI 是 undefined | preload 路径错、未编译、类型声明不等于运行时注入 | 打印绝对路径，检查产物和 contextBridge |
| No handler registered | channel 拼写不一致或 Handler 尚未注册 | 搜索 channel，两侧统一命名和启动顺序 |
| 页面白屏 | Vite 未启动、路径错误、CSP 阻止脚本 | 看 Main 日志、Network 和 Console |
| Not allowed to load local resource | 打包后路径仍指向源码目录 | 使用 __dirname、app.getAppPath() 和产物结构验证 |
| 应用启动即退出 | Main 入口异常、未处理的 Promise 拒绝 | 先在终端运行 Electron，捕获启动错误 |
| 开发正常、打包失败 | 依赖未进入产物、资源路径或原生模块不兼容 | 检查打包清单、asar、原生模块重建 |
| 关闭窗口后应用不退出 | macOS 生命周期逻辑或托盘驻留逻辑 | 检查 window-all-closed、before-quit |
| 页面重复收到消息 | React effect 重复订阅、未清理 listener | 每次订阅返回 dispose |
| 大数据导致卡顿 | 一次性 IPC、Main/Renderer 阻塞 | 分块、Worker/Utility Process、背压 |

### 13.4 Main 和 Renderer 双调试

Electron 官方教程提供了同时调试 Main 和 Renderer 的思路：Main 使用 Node 调试器，Renderer 通过 Chrome 调试协议附加。核心是给 Electron 启动参数增加：

~~~text
--remote-debugging-port=9222
~~~

VS Code 可以用 launch.json 的 compound configuration 同时启动两套调试配置。实际项目中建议建立：

- Main 调试配置。
- Renderer attach 配置。
- Main + Renderer compound 配置。
- 预发布模式调试配置。

---

## 14. 测试、构建和发布

### 14.1 测试分层

~~~text
纯函数测试
  ↓
Service/Repository 测试
  ↓
IPC Contract/Handler 测试
  ↓
Renderer 组件测试
  ↓
Electron 端到端测试
  ↓
打包产物冒烟测试
~~~

建议：

- 路径计算、数据转换、配置迁移写单元测试。
- 文件和数据库服务使用临时目录或测试数据库。
- IPC Handler 测试参数校验、sender 校验、成功和失败结构。
- Renderer 测试用 mock 的 window.desktopAPI，不要让每个组件都启动 Electron。
- 每个平台至少做一次安装、启动、打开窗口、读写数据、退出冒烟测试。

### 14.2 构建的四个阶段

Electron Forge 将发布流程概括为：

1. **Package**：将应用资源和运行时组织成可分发的应用目录/包。
2. **Make**：为目标平台生成安装包或可执行分发文件。
3. **Publish**：上传到下载平台或发布渠道。
4. **Update**：设计版本检查、下载、安装和回滚策略。

构建不是“执行一次 npm run build”就结束。至少要验证：

- package.json 的 main 是否正确。
- Main、Preload、Renderer 的产物是否齐全。
- 静态资源路径是否适用于开发和打包。
- 生产环境是否还依赖本地 Vite 服务。
- 原生模块是否针对目标 Electron ABI 重建。
- 应用图标、名称、版本号是否正确。
- macOS、Windows 的代码签名和权限是否处理。
- 自动更新是否有失败和回滚策略。

### 14.3 开发环境和生产环境的区别

~~~ts
const isDevelopment = !app.isPackaged;

if (isDevelopment) {
  await window.loadURL('http://localhost:5173');
} else {
  await window.loadFile(path.join(__dirname, '../renderer/index.html'));
}
~~~

不要只验证开发 URL 能打开。真正发布前必须使用与用户接近的打包产物验证 loadFile、静态资源、CSP、菜单、文件读写和更新流程。

### 14.4 版本管理

Electron 版本同时影响：

- Chromium 能力和安全补丁。
- Electron API 行为。
- 内嵌 Node.js 版本。
- 原生模块 ABI。
- 打包和签名生态。

推荐：

- 锁定 Electron 主版本和 lockfile。
- 定期升级，不要多年不升级后一次跨多个大版本。
- 每次升级阅读 Breaking Changes 和依赖兼容性。
- 在 CI 中固定 Node.js、包管理器和构建平台。

---

## 15. 结合当前仓库的学习入口

当前仓库不是一个纯 Electron 模板，而是“VS Code 扩展 + Electron 独立窗口 + React/Vite Renderer”的综合项目。可以按照下面顺序阅读，不要一开始从所有文件同时看起。

### 15.1 先看项目脚本

package.json 中已有 Electron 相关脚本：

~~~bash
npm run build:electron
npm run build:electron:renderer
npm run build:electron:all
npm run dev:electron:renderer
npm run dev:electron:main
npm run dev:electron
npm run start:electron:dev
npm run start:electron:prod
~~~

学习时先确认每个脚本的输入、输出和服务端口，再执行。特别注意：当前仓库同时有 VS Code 扩展的 main 入口和 Electron 的独立编译目录，不能只看一个 package.json 字段就推断所有启动方式。

### 15.2 推荐阅读顺序

1. src/electron/main/index.ts：观察 app、BrowserWindow、窗口生命周期。
2. src/electron/preload/index.ts：观察 contextBridge 暴露的 API。
3. src/electron/types/ipc.ts：观察消息类型、分块数据和布局类型。
4. src/electron/renderer/types/global.d.ts：观察 Renderer 如何获得 window.electronAPI 类型。
5. src/electron/renderer/App.tsx：观察 Renderer 如何订阅和发送消息。
6. src/electron/renderer/hooks/useWorkbench.ts：观察布局加载、保存和 UI 状态。
7. src/electron/renderer/vite.config.mts：理解 Renderer 构建输出目录。
8. src/electron/tsconfig.json：理解 Main/Preload 的 TypeScript 输出目录。

### 15.3 当前仓库的练习任务

#### 练习 A：去掉无类型边界

- 为 window.electronAPI 定义完整接口。
- 将 sendToMain 的参数改成 RendererToMain 联合类型。
- 将 Renderer 收到的消息改成 MainToRenderer 联合类型。
- 在 switch (message.type) 中使用 TypeScript 类型收窄。

#### 练习 B：将 IPC Handler 抽成服务

把 main/index.ts 中的逻辑拆成：

~~~text
main/index.ts
  ├─ application-lifecycle.ts
  ├─ window-manager.ts
  ├─ ipc/register-handlers.ts
  ├─ services/layout-service.ts
  └─ services/vscode-bridge-service.ts
~~~

Main 入口只负责装配，不负责实现所有业务。

#### 练习 C：持久化布局

当前内存 Map 适合演示，不适合应用重启后保留布局。实现：

- userData 下的配置文件或现有存储库。
- 配置版本号。
- 防止坏 JSON 导致应用无法启动。
- 窗口和显示器变化后的坐标校验。

#### 练习 D：大数据分块和背压

围绕当前的 DATA_CHUNK、REQUEST_MORE、CHUNK_PROCESSED 消息，补齐：

- 每个任务唯一 ID。
- 顺序和重复 chunk 检查。
- 最大内存限制。
- 取消任务。
- Renderer 关闭时清理 Main 侧任务。
- 超时和错误恢复。

#### 练习 E：安全改造

- 增加 sender 校验。
- 收紧 CSP。
- 评估 sandbox 配置。
- 限制导航和新窗口。
- 为外部链接建立 URL allowlist。
- 替换 @ts-nocheck，让编译器重新帮助你发现边界问题。

---

## 16. 强化知识点与面试式问答

### Q1：Electron 为什么不是一个普通的前端项目？

因为它拥有操作系统能力，并且界面和桌面能力运行在不同进程。除了 UI，还要处理 IPC、文件权限、窗口生命周期、打包、签名、更新和安全。

### Q2：Main 和 Renderer 最大的区别是什么？

Main 负责应用和系统能力，Renderer 负责网页界面。Main 可以访问 Node/Electron API；Renderer 默认不能直接访问 Node。两者通过 IPC 协作。

### Q3：Preload 为什么存在？

它是隔离环境中的窄桥：可以接触有限的 Electron 能力，再通过 contextBridge 暴露少量、明确的业务 API，避免 Renderer 获得完整系统权限。

### Q4：contextIsolation 解决什么问题？

它让 Preload 的上下文和网页的主世界隔离，减少网页代码篡改或读取特权对象的机会。开启它后，应使用 contextBridge 暴露 API。

### Q5：为什么优先用 invoke/handle？

因为它天然表达请求-响应，返回 Promise，调用方更容易处理 loading、成功和失败。send/on 更适合无返回值命令或事件通知。

### Q6：为什么不能把 ipcRenderer.send 直接暴露出去？

这样 Renderer 可以向 Main 发送任意 channel 和任意参数，权限边界失控。正确做法是为每种业务能力写一个最小 API，并在 Main 再次校验。

### Q7：TypeScript 已经有类型了，为什么还要做运行时校验？

TypeScript 类型会在编译后消失，IPC、文件、网络和用户输入都可能在运行时传入错误值。边界必须做 runtime validation。

### Q8：为什么 Main 不能做大计算？

Main 被阻塞时，窗口创建、IPC 响应和应用生命周期都可能卡住。应使用异步 API、Worker、Utility Process 或分块任务。

### Q9：Electron 的 Node.js 版本由谁决定？

应用运行时使用 Electron 内嵌的 Node.js，而不是用户机器上安装的 Node.js。Electron 升级也可能带来 Node/Chromium 能力和兼容性变化。

### Q10：用户配置应该写到哪里？

通常写到 app.getPath('userData')，而不是项目目录、当前工作目录或打包资源目录。配置要带版本号并支持迁移。

### Q11：为什么要写 CSP？

CSP 可以限制页面能加载和执行的脚本、样式、图片与连接来源，降低 XSS 和注入风险。它不是替代输入校验和 IPC sender 校验的万能方案。

### Q12：为什么开发环境能运行，打包后白屏？

开发环境通常加载 http://localhost，生产环境要加载打包后的本地资源。常见问题是 __dirname、Vite 输出目录、资源相对路径、CSP 或未被打包的依赖不一致。

### Q13：为什么要验证 IPC sender？

理论上不同 WebFrame、iframe 或子窗口都可能触发 IPC。Main 执行特权操作前要确认消息来自受信任窗口/来源，而不是只相信 channel 名称。

### Q14：什么时候需要多个 BrowserWindow？

当功能有清晰的独立窗口语义，例如设置、预览、日志、导入向导。不要为了组件拆分而创建窗口；窗口有额外的内存、生命周期和同步成本。

### Q15：如何设计一个好的 IPC 协议？

明确命名、明确请求和返回类型、稳定错误码、参数校验、权限校验、取消和超时语义、事件取消订阅、版本兼容策略。

### Q16：如何判断功能应该放在 Main 还是 Renderer？

如果需要系统权限、文件、数据库、窗口或秘密，放 Main/Service；如果只是 UI 交互和展示，放 Renderer；如果只是 CPU 计算，考虑 Worker/Utility Process。

### Q17：为什么不能把所有功能都做成事件？

事件适合广播和通知，但不天然表达响应、失败和取消。所有操作都用事件会让调用链、错误处理和测试困难。命令用请求响应，状态变化用事件。

### Q18：如何把 Electron 代码写得可测试？

把业务逻辑放到不依赖 Electron 的 Service/Domain 层，Main 只做生命周期和装配；IPC Handler 只做边界校验；Renderer 通过 mock 的 window.desktopAPI 测试。

---

## 17. 14 天实战路线

每天投入 1 到 2 小时，目标是完成一个“桌面数据工作台/笔记应用”。不要只看教程，每天都要产出可运行代码和一次提交。

| 天数 | 学习目标 | 必做产出 |
| --- | --- | --- |
| 第 1 天 | Node 运行时、npm、模块、文件与 HTML/CSS/JS 复习 | 完成进程信息和 JSON 配置练习 |
| 第 2 天 | 跑通最小 Electron | 一个能打开窗口的 Hello World |
| 第 3 天 | Main/Renderer/Preload | 画出自己的进程通信图 |
| 第 4 天 | IPC 请求响应 | 实现 app:get-version 和 settings:save |
| 第 5 天 | TypeScript 类型桥 | 共享协议、window.desktopAPI 声明 |
| 第 6 天 | 文件选择和读写 | 打开文本文件并显示内容 |
| 第 7 天 | 配置持久化 | 保存主题、窗口布局、最近文件 |
| 第 8 天 | React 页面架构 | loading/empty/error/success 状态齐全 |
| 第 9 天 | 数据服务抽离 | Main 入口不再直接处理所有业务 |
| 第 10 天 | 事件、取消和进度 | 大任务显示进度，可以取消 |
| 第 11 天 | 安全 | sender 校验、CSP、URL allowlist |
| 第 12 天 | 性能 | 大文件分块、Worker 或 Utility Process |
| 第 13 天 | 测试和调试 | 单元测试、IPC 测试、Main/Renderer 调试 |
| 第 14 天 | 构建发布 | 打包产物启动、读写、退出冒烟测试 |

### 17.1 实战项目的推荐功能

做一个“桌面数据工作台”，包含：

- 左侧文件/工作区树。
- 中间文本或表格编辑器。
- 右侧可拖拽卡片。
- 打开/保存/导出文件。
- 主题切换和布局持久化。
- 后台解析任务和进度条。
- 错误日志和取消按钮。
- 托盘或菜单栏入口。

它能覆盖 Electron 最重要的能力：窗口、IPC、文件、持久化、异步任务、性能、安全和打包。

### 17.2 每个功能的完成定义

一个功能只有满足下面条件才算完成：

- 正常路径可运行。
- 用户取消后状态正确。
- 参数错误会显示可理解的错误。
- Main 不被长任务阻塞。
- 窗口关闭后监听器和任务能清理。
- 重启应用后数据符合预期。
- 开发模式和打包模式都验证过。
- 至少有一条自动化测试或可重复的手工验证步骤。

---

## 18. 最终能力检查清单

### 基础

- [ ] 能解释 Electron、Chromium、Node.js 的关系。
- [ ] 能区分 Main、Renderer、Preload、Utility Process。
- [ ] 能独立创建 BrowserWindow 并处理 app.whenReady()。
- [ ] 能解释 macOS 与 Windows/Linux 的窗口退出差异。

### Node.js

- [ ] 能使用 node、npm、package.json 和 package-lock.json。
- [ ] 能区分 CommonJS、ESM、Node 内置模块和第三方依赖。
- [ ] 能解释事件循环、异步 I/O、阻塞调用和并发上限。
- [ ] 能使用 process、path、fs/promises、Buffer 和 EventEmitter。
- [ ] 能用 Stream 处理大文件，并理解背压。
- [ ] 能安全调用 child_process，区分 spawn、execFile 和同步 API。
- [ ] 能处理 Promise、回调、EventEmitter error 和未捕获异常。
- [ ] 能使用 Node Inspector 或 VS Code 调试 Main 进程。

### IPC

- [ ] 能选择 send/on 和 invoke/handle。
- [ ] 能写 typed preload API。
- [ ] 能为 window 添加 TypeScript 声明。
- [ ] 能校验参数、sender 和权限。
- [ ] 能设计错误码、取消、进度和事件清理。

### 桌面能力

- [ ] 能使用 dialog、shell、Menu、Tray、Notification。
- [ ] 能正确使用 app.getPath('userData')。
- [ ] 能处理路径、权限、文件不存在和大文件。
- [ ] 能调用外部命令并防止 shell 注入。

### 工程化

- [ ] 能拆分 Main、IPC、Service、Renderer 和 shared 类型。
- [ ] 能为配置做版本迁移。
- [ ] 能定位白屏、preload 未加载和 IPC channel 错误。
- [ ] 能同时调试 Main 和 Renderer。
- [ ] 能验证开发产物和打包产物。
- [ ] 能解释 Electron 升级、原生模块、签名和自动更新的风险。

### 安全

- [ ] nodeIntegration 不对不可信内容开启。
- [ ] contextIsolation 开启。
- [ ] sandbox、CSP、webSecurity 的取舍有明确理由。
- [ ] 不暴露通用 IPC 发送器。
- [ ] 不对不可信 URL 使用 shell.openExternal。
- [ ] 不把秘密放到 Renderer 或前端 bundle。

当你能完成这张清单，并独立交付一个有文件读写、持久化、IPC、打包和错误处理的应用，就已经从“会运行 Electron 示例”进入“能够开发 Electron 应用”的阶段。

---

## 19. 官方资料

以下链接是本指南的主要资料来源，版本变化时优先以官方内容为准：

- [Electron Prerequisites](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)：环境、Node.js、Git 和学习前提。
- [Building your First App](https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app)：最小应用、BrowserWindow、生命周期和调试。
- [Using Preload Scripts](https://www.electronjs.org/docs/latest/tutorial/tutorial-preload)：Preload、上下文隔离和 IPC 入门。
- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model)：Main、Renderer、Preload 和 Utility Process。
- [Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc)：ipcMain、ipcRenderer 和常见通信模式。
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)：contextBridge 和安全暴露 API。
- [Security](https://www.electronjs.org/docs/latest/tutorial/security)：Electron 安全检查清单。
- [BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)：窗口创建、加载和显示策略。
- [App API](https://www.electronjs.org/docs/latest/api/app)：应用生命周期。
- [Packaging Your Application](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging)：打包基础。
- [Distributing Apps With Electron Forge](https://www.electronjs.org/docs/latest/tutorial/forge-overview)：Package、Make、Publish 和发布工具链。
- [TypeScript Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference)：模块解析和运行时/构建工具的匹配。
- [TypeScript Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)：类型守卫和运行时分支对应的类型收窄。
- [Node.js Learn](https://nodejs.org/learn)：Node.js 入门、文件、异步、并发、调试和测试学习路线。
- [Node.js Introduction](https://nodejs.org/en/learn)：Node.js 运行时、V8 和非阻塞 I/O 基础。
- [Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)：事件循环、timers、poll、setImmediate 和 process.nextTick。
- [Node.js Modules](https://nodejs.org/api/modules.html)：CommonJS 模块和模块加载。
- [Node.js File System](https://nodejs.org/api/fs.html)：同步、回调和 fs/promises 文件 API。
- [Node.js Path](https://nodejs.org/api/path.html)：跨平台路径处理。
- [Node.js Process](https://nodejs.org/api/process.html)：参数、环境变量、平台和进程生命周期。
- [Node.js Events](https://nodejs.org/api/events.html)：EventEmitter 和事件监听。
- [Node.js Streams](https://nodejs.org/api/stream.html)：Stream、pipeline 和背压相关 API。
- [Node.js Child Process](https://nodejs.org/api/child_process.html)：spawn、execFile、fork 和子进程生命周期。
- [Debugging Node.js](https://nodejs.org/en/learn/getting-started/debugging)：Node Inspector 和调试方法。
- [npm package.json](https://docs.npmjs.com/cli/configuring-npm/package-json/)：项目元数据、依赖和脚本配置。
- [npm Scripts](https://docs.npmjs.com/cli/using-npm/scripts/)：npm scripts 和生命周期。
- [npm dependencies](https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file)：dependencies 与 devDependencies 的区别。

---

## 一句话总结

学习 Electron 的正确顺序不是先背 API，而是先建立这条主线：

~~~text
Web 基础
  → Node.js 基础
  → Main/Renderer/Preload 进程模型
  → 类型化 IPC
  → 文件/数据库/系统能力
  → 安全
  → 性能
  → 测试、打包和发布
~~~

只要你始终坚持“Renderer 负责界面、Preload 暴露窄桥、Main 负责权限和服务、边界做校验、长任务做隔离”，就能从会写 Demo 稳定过渡到能维护真实 Electron 应用。
