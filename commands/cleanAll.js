import chalk from 'chalk';
import { getManifest, removeUninstalledPackages } from '../lib/manifest.js';
import { deleteFiles } from '../lib/fileOps.js';
import fs from 'fs';

export default async function cleanAllCommand() {
  console.log(chalk.magenta(`[theme-tools] Cleaning all uninstalled packages...`));

  const manifest = await getManifest();
  const installed = Object.keys(JSON.parse(fs.readFileSync('package.json')).dependencies || {});
  const toRemove = Object.keys(manifest).filter(pkg => !installed.includes(pkg));

  for (const pkg of toRemove) {
    const files = await removeUninstalledPackages(pkg);
    await deleteFiles(files);
    console.log(chalk.magenta(`Removed ${files.length} files from ${pkg}`));
  }
}