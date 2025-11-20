import fs from 'node:fs/promises';
import path from 'node:path';

const cleanupTargets = [
  '.next/cache/webpack',
  '.next/cache/swc',
];

const removeDirectory = async (relativePath) => {
  const fullPath = path.join(process.cwd(), relativePath);

  try {
    await fs.rm(fullPath, { recursive: true, force: true });
    console.log(`Removed ${relativePath}`);
  } catch (error) {
    console.warn(`Could not remove ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

await Promise.all(cleanupTargets.map((target) => removeDirectory(target)));
