import { promises as fs } from 'fs';
import path from 'path';

const rootDir = process.cwd();

const slugDirectories = [
  'content/catalog',
  'content/catalog-categories',
  'content/catalog-processes',
  'content/catalog-bases',
  'content/catalog-fillers',
  'content/catalog-auxiliaries',
  'content/documents',
];

function normalizeSlugValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return { name: value, slug: value };
  if (typeof value === 'object') {
    const name = 'name' in value ? value.name ?? null : value.slug ?? null;
    const slug = 'slug' in value ? value.slug ?? null : value.name ?? null;
    return { name, slug };
  }
  return value;
}

async function processFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);
  let changed = false;

  if ('slugKey' in data) {
    const next = normalizeSlugValue(data.slugKey);
    if (JSON.stringify(next) !== JSON.stringify(data.slugKey)) {
      data.slugKey = next;
      changed = true;
    }
  }

  if ('value' in data) {
    const next = normalizeSlugValue(data.value);
    if (JSON.stringify(next) !== JSON.stringify(data.value)) {
      data.value = next;
      changed = true;
    }
  }

  if (!changed) return;

  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`Updated ${path.relative(rootDir, filePath)}`);
}

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
    } else if (entry.isFile() && entry.name === 'index.json') {
      await processFile(fullPath);
    }
  }
}

(async () => {
  for (const dir of slugDirectories) {
    await walk(path.join(rootDir, dir));
  }
})();
