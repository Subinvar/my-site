#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';

const COLLECTIONS = [
  'content/pages',
  'content/posts',
  'content/catalog',
  'content/documents',
];

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function validateCollection(relativeDir, issues) {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  let dirEntries;

  try {
    dirEntries = await fs.readdir(absoluteDir, { withFileTypes: true });
  } catch (error) {
    issues.push(`Cannot read collection directory "${relativeDir}": ${error.message}`);
    return;
  }

  for (const entry of dirEntries) {
    if (entry.isDirectory()) {
      const dir = path.join(absoluteDir, entry.name);
      const primaryIndexPath = path.join(dir, 'index.json');
      const nestedIndexPath = path.join(dir, 'index', 'index.json');
      const primaryExists = await pathExists(primaryIndexPath);
      const nestedExists = await pathExists(nestedIndexPath);
      const indexPath = primaryExists ? primaryIndexPath : nestedExists ? nestedIndexPath : null;

      if (!indexPath) {
        issues.push(
          `Missing index.json for entry "${entry.name}" in collection "${relativeDir}" (checked ${primaryIndexPath} and ${nestedIndexPath}).`,
        );
        continue;
      }

      await validateJson(indexPath, relativeDir, entry.name, issues);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.json')) {
      const filePath = path.join(absoluteDir, entry.name);
      await validateJson(filePath, relativeDir, entry.name.replace(/\.json$/i, ''), issues);
    }
  }
}

async function validateJson(filePath, relativeDir, key, issues) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    JSON.parse(raw);
  } catch (error) {
    issues.push(
      `Invalid JSON for fallback entry "${key}" in "${relativeDir}" at ${filePath}: ${error.message}`,
    );
  }
}

async function main() {
  const issues = [];

  for (const collection of COLLECTIONS) {
    await validateCollection(collection, issues);
  }

  if (issues.length > 0) {
    console.error('Fallback collection integrity check failed:');
    for (const issue of issues) {
      console.error(` - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Fallback collections look good.');
}

main();
