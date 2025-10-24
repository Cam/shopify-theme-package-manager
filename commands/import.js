import chalk from 'chalk';
import { importAndTrack } from '../lib/importAndTrack.js';
import { updateManifest } from '../lib/manifest.js';

export default async function importCommand(pkgName) {
  console.log(chalk.green(`[theme-tools] Importing files from ${pkgName}...`));

  // Import files and update manifest
  const files = await importAndTrack(pkgName);
  await updateManifest(pkgName, files);

  console.log(chalk.green(`[theme-tools] Imported ${files.length} files.`));
}