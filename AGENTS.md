# AGENTS.md - Agentic Coding Guidelines

当我问你的时候，先给出方案不要直接改我的源代码逻辑和文件
This document provides guidelines for agentic coding agents operating in this repository.

## Project Overview

This is a VS Code extension written in TypeScript. The extension provides a simple validation helper that prompts users for input (email, phone, JSON, etc.) and validates it.

## Build Commands

### Development
```bash
npm run watch       # Watch mode - compiles on file changes
npm run compile     # Full compile (type check + lint + build)
```

### Testing
```bash
npm run test        # Run all VS Code extension tests
```

To run a single test file, use VS Code's test runner or modify the test configuration in `.vscode/launch.json`.

### Production
```bash
npm run package     # Production build (type check + lint + build)
```

### Linting & Type Checking
```bash
npm run lint        # Run ESLint on src/
npm run check-types # Run TypeScript type checking (noEmit)
```

## Code Style Guidelines

### Language & Configuration
- **Language**: TypeScript with strict mode enabled
- **Target**: ES2022, Node16 modules
- **ESLint**: typescript-eslint with custom rules

### TypeScript
- All strict type-checking options are enabled
- Use explicit types for function parameters and return types
- Avoid `any` - use `unknown` when type is truly unknown

### Imports
```typescript
import * as vscode from 'vscode';  // Default for vscode module
import { something } from './module';  // Named imports for local modules
```
- Import names should follow `camelCase` or `PascalCase`

### Naming Conventions
- Variables/functions: `camelCase`
- Classes/types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE` or `camelCase` with `const` keyword
- ESLint rule: `@typescript-eslint/naming-convention` set to warn

### Formatting
- Use semicolons (enforced by ESLint: `semi: "warn"`)
- Curly braces required for all blocks (enforced: `curly: "warn"`)
- Use strict equality `===` / `!==` (enforced: `eqeqeq: "warn"`)

### Error Handling
- Do not throw literals - throw `Error` objects (enforced: `no-throw-literal: "warn"`)
- Use try-catch for async operations
- Display errors to users via `vscode.window.showErrorMessage()`

### VS Code Extension Patterns

#### Activation
```typescript
export function activate(context: vscode.ExtensionContext) {
    // Register commands, providers, etc.
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Cleanup if needed
}
```

#### Commands
- Command IDs follow pattern: `extension-name.commandName`
- Register with `vscode.commands.registerCommand()`
- Always push disposable to `context.subscriptions`

#### UI Feedback
- Use `vscode.window.showInformationMessage()` for success
- Use `vscode.window.showWarningMessage()` for warnings
- Use `vscode.window.showErrorMessage()` for errors
- Use `vscode.window.showInputBox()` for user input

### Testing
- Tests go in `src/test/`
- Use Mocha + VS Code test runner
- Test file naming: `*.test.ts`
- Suite pattern: `suite('Description', () => { test('it works', () => { ... }); });`

## File Structure
```
src/
├── extension.ts      # Main extension entry point
└── test/
    └── extension.test.ts  # Test suite

dist/                 # Compiled output (generated)
out/                  # Test output (generated)
```

## Common Tasks

### Adding a New Command
1. Add command to `contributes.commands` in `package.json`
2. Register command in `activate()` using `vscode.commands.registerCommand()`
3. Add test in `src/test/`

### Adding Dependencies
```bash
npm install <package> --save  # Production
npm install <package> --save-dev  # Development
```

### Debugging
Use VS Code's built-in debugger with the "Extension" launch configuration in `.vscode/launch.json`.

## Notes

- Chinese comments are used in the source code (e.g., `// 注册命令`)
- The extension activates on `onCommand:my-extension.helloWorld`
- Build uses esbuild for fast bundling
