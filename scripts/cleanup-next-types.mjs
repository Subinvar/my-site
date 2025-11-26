import fs from 'node:fs/promises';
import path from 'node:path';

const foldersToRemove = [
  path.join(process.cwd(), '.next', 'types'),
  path.join(process.cwd(), '.next', 'dev', 'types'),
];

for (const folder of foldersToRemove) {
  try {
    await fs.rm(folder, { recursive: true, force: true });
    console.log(`Removed ${folder}`);
  } catch (error) {
    console.error(`Failed to remove ${folder}:`, error);
    process.exitCode = 1;
  }
}
