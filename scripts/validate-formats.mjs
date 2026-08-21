import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const strictJsonFiles = [
  'package.json',
  'tsconfig.json',
  'src/webview/tsconfig.bitmap.json',
  'src/webview/tsconfig.line-chart.json',
  'src/electron/tsconfig.json',
  '.prettierrc.json',
];

const corruptionCheckFiles = [
  ...strictJsonFiles,
  '.vscode/launch.json',
  '.vscode/tasks.json',
  '.vscode/settings.json',
  '.vscode/extensions.json',
];

const metaArtifactPattern = /^\[[^\]]+#[A-F0-9]+\]$/;
const elidedLinePattern = /^\d+-\d+:/;

function fail(message) {
  console.error(`✘ ${message}`);
  process.exitCode = 1;
}

function checkCorruption(relativePath, content) {
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (metaArtifactPattern.test(line)) {
      fail(`${relativePath}:${index + 1} contains corrupted artifact header: ${line}`);
    }

    if (elidedLinePattern.test(line)) {
      fail(`${relativePath}:${index + 1} contains elided placeholder content: ${line}`);
    }
  }
}

function validateJsonFile(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!fs.existsSync(absolutePath)) {
    return;
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  checkCorruption(relativePath, content);

  if (strictJsonFiles.includes(relativePath)) {
    try {
      JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fail(`${relativePath} is not valid JSON: ${message}`);
    }
  }
}

console.log('Validating JSON and config file formats...');

for (const file of corruptionCheckFiles) {
  validateJsonFile(file);
}

if (process.exitCode) {
  console.error('\nFormat validation failed.');
  process.exit(process.exitCode);
}

console.log('✔ All checked config files are valid.');
