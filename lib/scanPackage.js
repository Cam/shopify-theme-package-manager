// Scans and categorizes package contents

import fs from 'fs-extra';
import path from 'path';
import { extractKeyPaths } from './utils.js';
import { SHOPIFY_FOLDERS, IGNORE_FILES } from './constants.js';

export async function scanPackage(pkgName) {
  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
  const themeRoot = process.cwd();

  const importedFiles = [];
  let frontendLocales = {};
  let schemaLocales = {};
  let frontendKeys = [];
  let schemaKeys = [];
  let settingsBlocks = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(pkgRoot, fullPath);

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (IGNORE_FILES.includes(entry.name)) {
        continue;
      } else if (relPath === 'locales/en.default.json') {
        const content = await fs.readJson(fullPath);
        frontendLocales = { ...frontendLocales, ...content };
        frontendKeys.push(...extractKeyPaths(content));
      } else if (relPath === 'locales/en.default.schema.json') {
        const content = await fs.readJson(fullPath);
        schemaLocales = { ...schemaLocales, ...content };
        schemaKeys.push(...extractKeyPaths(content));
      } else if (relPath === 'config/settings_schema.json') {
        const content = await fs.readJson(fullPath);
        settingsBlocks = settingsBlocks.concat(content);
      } else if (SHOPIFY_FOLDERS.some(folder => relPath.startsWith(folder + '/'))) {
        const targetPath = path.join(themeRoot, relPath);
        await fs.copy(fullPath, targetPath);
        importedFiles.push(relPath);
      }
    }
  }

  await walk(pkgRoot);

  return {
    importedFiles,
    frontendLocales,
    schemaLocales,
    frontendKeys,
    schemaKeys,
    settingsBlocks
  };
}