import chalk from 'chalk';
import { scanPackage } from '../lib/fileOps.js';
import { updateManifest } from '../lib/manifest.js';

export default async function importCommand(pkgName) {
  console.log(chalk.green(`[theme-tools] Importing files from ${pkgName}...`));

  const files = await scanPackage(pkgName);
  await updateManifest(pkgName, files);

  console.log(chalk.green(`[theme-tools] Imported ${files.length} files.`));
}