import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const nextDir = path.join(process.cwd(), '.next');
const lockPath = path.join(nextDir, 'lock');
const traceDir = path.join(nextDir, 'server');
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
