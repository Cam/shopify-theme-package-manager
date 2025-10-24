import chalk from 'chalk';
import { importAndTrack } from '../lib/importAndTrack.js';
import { updateManifest } from '../lib/manifest.js';

export default async function importCommand(pkgName) {
  console.log(chalk.green(`[stpm] Importing files from ${pkgName}...`));

  // Import files and update manifest
  const files = await importAndTrack(pkgName);
  await updateManifest(pkgName, files);

  console.log(chalk.green(`[stpm] Imported ${files.length} files.`));
}