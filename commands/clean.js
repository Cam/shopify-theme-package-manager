import chalk from 'chalk';
import { removeFromManifest } from '../lib/manifest.js';
import { deleteFiles } from '../lib/fileOps.js';

export default async function cleanCommand(pkgName) {
  console.log(chalk.yellow(`[theme-tools] Cleaning files from ${pkgName}...`));

  const files = await removeFromManifest(pkgName);
  await deleteFiles(files);

  console.log(chalk.yellow(`[theme-tools] Removed ${files.length} files.`));
}