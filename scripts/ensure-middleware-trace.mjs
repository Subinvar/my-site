import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const tracePath = path.join(process.cwd(), '.next', 'server', 'middleware.js.nft.json');
const traceDir = path.dirname(tracePath);

try {
  await access(tracePath);
  console.log(`middleware trace already exists at ${tracePath}`);
  process.exit(0);
} catch {
  // continue and create the fallback file
}

const payload = { version: 1, files: [] };
await mkdir(traceDir, { recursive: true });
await writeFile(tracePath, JSON.stringify(payload), 'utf8');
console.log(`created fallback middleware trace at ${tracePath}`);
