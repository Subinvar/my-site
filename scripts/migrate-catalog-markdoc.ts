import { promises as fs } from 'fs';
import path from 'path';

const locales = ['ru', 'en'] as const;
const contentRoot = path.join(process.cwd(), 'content', 'catalog');
const keystaticContentRoot = path.join(process.cwd(), 'content');

type MarkdocValue =
  | string
  | { content?: string | null; node?: unknown }
  | null
  | undefined;

type CatalogEntry = {
  content?: Partial<Record<(typeof locales)[number], MarkdocValue>> | null;
};

async function fileExists(candidate: string): Promise<boolean> {
  return fs
    .stat(candidate)
    .then((stats) => stats.isFile())
    .catch(() => false);
}

async function readEntryJson(entryPath: string): Promise<CatalogEntry | null> {
  try {
    const raw = await fs.readFile(entryPath, 'utf8');
    return JSON.parse(raw) as CatalogEntry;
  } catch (error) {
    console.warn(`Не удалось прочитать ${entryPath}:`, error);
    return null;
  }
}

async function ensureDir(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
}

async function migrateEntry(entryDir: string): Promise<void> {
  const primaryIndex = path.join(entryDir, 'index.json');
  const nestedIndex = path.join(entryDir, 'index', 'index.json');
  const indexPath = (await fileExists(primaryIndex))
    ? primaryIndex
    : (await fileExists(nestedIndex))
      ? nestedIndex
      : null;

  if (!indexPath) {
    return;
  }

  const entry = await readEntryJson(indexPath);
  if (!entry) {
    return;
  }

  const content = (entry.content ??= {});
  const indexDir = path.join(entryDir, 'index');
  const hasIndexDir = await fs
    .stat(indexDir)
    .then((stats) => stats.isDirectory())
    .catch(() => false);
  const contentDir = hasIndexDir ? path.join(indexDir, 'content') : path.join(entryDir, 'content');

  let updated = false;

  for (const locale of locales) {
    const existingFilePath = path.join(contentDir, `${locale}.mdoc`);
    const currentValue = content[locale];
    let source: string | null = null;

    if (typeof currentValue === 'string' && currentValue.trim()) {
      const potentialPath = path.isAbsolute(currentValue)
        ? currentValue
        : path.join(keystaticContentRoot, currentValue);
      if (await fileExists(potentialPath)) {
        source = await fs.readFile(potentialPath, 'utf8');
      } else {
        source = currentValue;
      }
    } else if (currentValue && typeof currentValue === 'object' && 'content' in currentValue) {
      const contentValue = (currentValue as { content?: string | null }).content;
      if (typeof contentValue === 'string') {
        source = contentValue;
      }
    }

    if (!source && (await fileExists(existingFilePath))) {
      const relative = path.relative(keystaticContentRoot, existingFilePath);
      if (content[locale] !== relative) {
        content[locale] = relative;
        updated = true;
      }
      continue;
    }

    if (!source) {
      continue;
    }

    await ensureDir(contentDir);
    await fs.writeFile(existingFilePath, source, 'utf8');
    content[locale] = path.relative(keystaticContentRoot, existingFilePath);
    updated = true;
  }

  if (updated) {
    await fs.writeFile(indexPath, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
    console.log(`Обновлена запись: ${path.relative(contentRoot, entryDir)}`);
  }
}

async function main(): Promise<void> {
  const catalogEntries = await fs.readdir(contentRoot).catch(() => []);

  for (const entryName of catalogEntries) {
    const entryDir = path.join(contentRoot, entryName);
    const stats = await fs.stat(entryDir).catch(() => null);
    if (!stats || !stats.isDirectory()) {
      continue;
    }

    await migrateEntry(entryDir);
  }
}

main().catch((error) => {
  console.error('Миграция завершилась с ошибкой:', error);
  process.exit(1);
});
