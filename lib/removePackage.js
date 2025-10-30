// Removes a packages based on the .stpm-imports.json manifest

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { removeSchemaBlocks, removeLocaleKeys } from './utils.js';

export async function removePackage(pkgName) {
  const manifestPath = path.join(process.cwd(), '.stpm-imports.json');
  if (!(await fs.pathExists(manifestPath))) return;

  const manifest = await fs.readJson(manifestPath);
  const entry = manifest[pkgName];
  if (!entry) return;

  // 1. Remove imported files
  for (const relPath of entry.files || []) {
    const fullPath = path.join(process.cwd(), relPath);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      console.log(chalk.gray(`[stpm] Removed file: ${relPath}`));
    }
  }

  // 2. Remove locale keys
  await removeLocaleKeys('locales/en.default.json', entry.locales?.frontend || []);
  await removeLocaleKeys('locales/en.default.schema.json', entry.locales?.schema || []);

  // 3. Remove settings schema blocks
  await removeSchemaBlocks(entry.settingsSchema || []);

  // 4. Uninstall npm package
  try {
    execSync(`npm uninstall ${pkgName}`, { stdio: 'inherit' });
    console.log(chalk.gray(`[stpm] Uninstalled ${pkgName}`));
  } catch (err) {
    console.warn(chalk.yellow(`[stpm] Failed to uninstall ${pkgName}: ${err.message}`));
  }

  // 5. Update manifest
  delete manifest[pkgName];
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  console.log(chalk.green(`[stpm] ✅ Removed ${pkgName}`));
}