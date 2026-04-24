# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A VS Code extension that launches an Electron-based graphical workbench for data visualization. The extension provides:
- Data panel webview in VS Code sidebar
- Electron window with draggable card layout (react-grid-layout)
- ICE service integration with streaming data transfer
- Bitmap visualization component with multiple parser formats (JSON, STDF, TXT)

## Build Commands

```bash
# Development - watch mode
npm run watch                    # Parallel watch for esbuild + tsc
npm run compile                  # Full compile (type check + lint + build)

# Electron-specific builds
npm run build:electron           # Build Electron main process (tsc)
npm run build:electron:renderer  # Build Electron renderer (Vite)
npm run build:electron:all       # Build both
npm run start:electron           # Build and launch Electron window

# Webview build
npm run build:webview            # Build webview (Vite)
npm run dev:webview              # Watch mode for webview

# Production
npm run package                  # Production build for VS Code extension

# Testing
npm run test                     # Run VS Code extension tests
npm run lint                     # Run ESLint
npm run check-types              # TypeScript type checking (noEmit)
```

## Architecture

```
VS Code Extension (src/ext/)
    │ stdio IPC (child_process spawn)
    ▼
Electron Main Process (src/electron/main/)
    │ ipcMain/ipcRenderer
    ▼
Electron Renderer (React + react-grid-layout + Konva)
```

### Three-Layer IPC Communication

1. **VS Code Extension → Electron Main**: `child_process.spawn()` with `stdio: ['pipe', 'pipe', 'pipe', 'ipc']`
2. **Electron Main → Renderer**: `webContents.send()` / `ipcRenderer.on()`
3. **Data flow**: Chunked streaming with backpressure control via `DataChunk` interface

### Key IPC Message Types

Defined in [src/electron/types/ipc.ts](src/electron/types/ipc.ts):
- `ExtToMain`: `LOAD_DATA`, `CANCEL_LOAD`, `WINDOW_READY`, `GET_VISIBLE_CARDS`
- `MainToRenderer`: `DATA_CHUNK`, `DATA_COMPLETE`, `DATA_ERROR`, `WINDOW_READY_ACK`
- `RendererToMain`: `CHUNK_PROCESSED`, `REQUEST_MORE`, `SAVE_LAYOUT`, `LOAD_LAYOUT`

### Data Processing Pipeline

[src/ext/electron/dataProcessor.ts](src/ext/electron/dataProcessor.ts) handles:
- Chunking large datasets into `DataChunk` objects
- Backpressure-aware sending via callbacks
- LRU cache for processed data

### Card System

Cards are the visual units in the Electron workbench. Each card:
- Has a `CardType`: `'echarts'` | `'logicflow'` | `'canvas'`
- Contains parsed data from ICE service
- Supports drag/resize via react-grid-layout

### Bitmap Visualization Component

Located in [src/webview/components/bitmap/](src/webview/components/bitmap/):
- Parsers: `JSONParser`, `STDFParser`, `TXTParser` (auto-detected by file extension)
- Color mapping with configurable schemes
- Canvas-based rendering using Konva

## TypeScript Configuration

Multiple tsconfig files for different contexts:
- Root [tsconfig.json](tsconfig.json): VS Code extension code (Node16, ES2022)
- [src/webview/tsconfig.json](src/webview/tsconfig.json): Webview React code
- [src/electron/tsconfig.json](src/electron/tsconfig.json): Electron main process
- [src/electron/renderer/tsconfig.json](src/electron/renderer/tsconfig.json): Electron renderer React code

## Development Notes

- **Language**: Chinese comments are used throughout source code
- **Strict TypeScript**: All strict mode options enabled
- **ESLint**: Uses typescript-eslint with `semi`, `curly`, `eqeqeq` rules
- **Before modifying code**: First propose the approach, do not directly change source code logic (per AGENTS.md)

## Extension Commands

- `my-extension.helloWorld`: Input validation demo
- `my-extension.openDataPanel`: Open data panel in sidebar
- `my-extension.openElectronWorkbench`: Launch Electron workbench
- `my-extension.closeElectronWorkbench`: Close Electron window
