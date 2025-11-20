import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const targets = [
  '.next/cache/webpack',
];

async function removePath(path) {
  const target = resolve(process.cwd(), path);
  try {
    await rm(target, { recursive: true, force: true });
    console.log(`Removed ${path}`);
  } catch (error) {
    console.warn(`Failed to remove ${path}:`, error);
  }
}

async function main() {
  await Promise.all(targets.map(removePath));
}

main();
