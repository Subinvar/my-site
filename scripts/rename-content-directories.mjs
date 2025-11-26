import { promises as fs } from 'fs';
import path from 'path';

const rootDir = process.cwd();

const targets = [
  { root: 'content/catalog', slugField: 'slugKey' },
  { root: 'content/catalog-categories', slugField: 'value' },
  { root: 'content/catalog-processes', slugField: 'value' },
  { root: 'content/catalog-bases', slugField: 'value' },
  { root: 'content/catalog-fillers', slugField: 'value' },
  { root: 'content/catalog-auxiliaries', slugField: 'value' },
  { root: 'content/pages', slugField: 'slugKey' },
  { root: 'content/posts', slugField: 'slugKey' },
  { root: 'content/documents', slugField: 'slugKey' },
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'ENOENT') {
      console.warn(`Cannot access ${filePath}:`, error);
    }
    return false;
  }
}

function extractSlug(data, slugField) {
  const value = data?.[slugField];
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const slug = typeof value.slug === 'string' ? value.slug.trim() : null;
    const name = typeof value.name === 'string' ? value.name.trim() : null;
    return slug || name || null;
  }
  return null;
}

async function renameEntry(root, dirent, slugField) {
  if (!dirent.isDirectory()) return { renamed: false };

  const entryPath = path.join(root, dirent.name);
  const indexPath = path.join(entryPath, 'index.json');

  if (!(await exists(indexPath))) return { renamed: false };

  const data = JSON.parse(await fs.readFile(indexPath, 'utf8'));
  const slug = extractSlug(data, slugField);

  if (!slug || slug === dirent.name) return { renamed: false };

  const targetPath = path.join(root, slug);
  if (await exists(targetPath)) {
    console.warn(
      `Skip ${path.relative(rootDir, entryPath)} → ${path.relative(rootDir, targetPath)}: target exists.`
    );
    return { renamed: false };
  }

  const tempPath = `${entryPath}__renaming__`;
  await fs.rename(entryPath, tempPath);
  await fs.rename(tempPath, targetPath);

  console.log(
    `Moved ${path.relative(rootDir, entryPath)} → ${path.relative(rootDir, targetPath)}`
  );

  return { renamed: true };
}

async function removeEmptyDirs(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  if (entries.length === 0) {
    await fs.rmdir(dirPath);
    console.log(`Removed empty directory ${path.relative(rootDir, dirPath)}`);
    return true;
  }

  let removedAny = false;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const childPath = path.join(dirPath, entry.name);
    const childRemoved = await removeEmptyDirs(childPath);
    removedAny = removedAny || childRemoved;
  }

  const refreshed = await fs.readdir(dirPath);
  if (refreshed.length === 0) {
    await fs.rmdir(dirPath);
    console.log(`Removed empty directory ${path.relative(rootDir, dirPath)}`);
    return true;
  }

  return removedAny;
}

async function processRoot(root, slugField) {
  const absoluteRoot = path.join(rootDir, root);
  const entries = await fs.readdir(absoluteRoot, { withFileTypes: true });

  let renamed = false;
  for (const entry of entries) {
    const result = await renameEntry(absoluteRoot, entry, slugField);
    renamed = renamed || result.renamed;
  }

  await removeEmptyDirs(absoluteRoot);

  if (!renamed) {
    console.log(`No rename needed for ${root}`);
  }
}

async function main() {
  for (const target of targets) {
    await processRoot(target.root, target.slugField);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
