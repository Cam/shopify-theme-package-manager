//  Main orchestrator for STPM-native packages

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { scanPackage } from './scanPackage.js';
import { mergeFrontendLocales, mergeSchemaLocales, mergeSettingsSchema } from './merge.js';

export async function importNativePackage(pkgName) {
  const {
    importedFiles,
    frontendLocales,
    schemaLocales,
    frontendKeys,
    schemaKeys,
    settingsBlocks
  } = await scanPackage(pkgName);

  if (Object.keys(frontendLocales).length) {
    await mergeFrontendLocales(frontendLocales);
  }

  if (Object.keys(schemaLocales).length) {
    await mergeSchemaLocales(schemaLocales);
  }

  if (settingsBlocks.length) {
    await mergeSettingsSchema(settingsBlocks);
  }

  // ✅ Write manifest entry
  const manifestPath = path.join(process.cwd(), '.stpm-imports.json');
  const manifest = (await fs.pathExists(manifestPath)) ? await fs.readJson(manifestPath) : {};

  manifest[pkgName] = {
    files: importedFiles,
    locales: {
      frontend: frontendKeys,
      schema: schemaKeys
    },
    settingsSchema: settingsBlocks.map(block => ({
      name: block.name,
      type: block.type
    }))
  };

  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  console.log(chalk.green(`[stpm] ✅ Imported ${pkgName}`));
}