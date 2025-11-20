import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const traceDir = path.join(process.cwd(), '.next', 'server');
const traceFilenames = ['proxy.js.nft.json', 'middleware.js.nft.json'];
const payload = { version: 1, files: [] };

await mkdir(traceDir, { recursive: true });

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
