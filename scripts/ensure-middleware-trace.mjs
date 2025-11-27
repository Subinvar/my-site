import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const nextDir = path.join(process.cwd(), '.next');
const lockPath = path.join(nextDir, 'lock');
const traceDir = path.join(nextDir, 'server');
const middlewarePath = path.join(traceDir, 'middleware.js');
const traceFilenames = ['proxy.js.nft.json', 'middleware.js.nft.json'];
const payload = { version: 1, files: [] };

await mkdir(traceDir, { recursive: true });

try {
  await access(lockPath);
  console.log(`.next lock file already exists at ${lockPath}`);
} catch {
  await writeFile(lockPath, '', 'utf8');
  console.log(`created fallback .next lock file at ${lockPath}`);
}

for (const filename of traceFilenames) {
  const tracePath = path.join(traceDir, filename);
  try {
    await access(tracePath);
    console.log(`${filename} trace already exists at ${tracePath}`);
  } catch {
    await writeFile(tracePath, JSON.stringify(payload), 'utf8');
    console.log(`created fallback ${filename} trace at ${tracePath}`);
  }
}

try {
  await access(middlewarePath);
  console.log(`middleware.js entry already exists at ${middlewarePath}`);
} catch {
  const fallbackMiddleware = `// Fallback middleware entry generated for environments that expect .next/server/middleware.js\n` +
    `// The real middleware code is emitted as edge chunks by Turbopack; this file simply passes requests through.\n` +
    `const { NextResponse } = require('next/server');\n` +
    `const matcher = [\n` +
    `  '/((?!_next|api|keystatic|.*\\\\.[^/]+$).*)',\n` +
    `  '/((?=.+\\\\.(?:xml|webmanifest)$).*)',\n` +
    `  '/keystatic/:path*',\n` +
    `  '/api/keystatic/:path*',\n` +
    `];\n` +
    `function middleware() {\n` +
    `  return NextResponse.next();\n` +
    `}\n` +
    `module.exports = { middleware, config: { matcher } };\n`;

  await writeFile(middlewarePath, fallbackMiddleware, 'utf8');
  console.log(`created fallback middleware.js entry at ${middlewarePath}`);
}