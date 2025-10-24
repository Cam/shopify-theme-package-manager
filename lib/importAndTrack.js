// lib/importAndTrack.js

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { scanPackage } from './fileOps.js';

/**
 * Imports files from a package and updates the .stpm-imports.json manifest.
 * Used by both `import` and `add` commands to keep logic consistent.
 */
export async function importAndTrack(pkgName) {
  // Run the core importer
  const importedFiles = await scanPackage(pkgName);
  if (importedFiles.length === 0) {
    console.log(chalk.gray(`[stpm] No files imported from ${pkgName}.`));
    return;
  }

  // Load existing manifest (if any)
  const manifestPath = path.join(process.cwd(), '.stpm-imports.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    manifest = await fs.readJson(manifestPath);
  }

  // Update manifest with new import
  manifest[pkgName] = {
    importedAt: new Date().toISOString(),
    files: importedFiles
  };

  // Write updated manifest
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  console.log(chalk.gray(`[stpm] Updated .stpm-imports.json`));
}