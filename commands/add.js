import { execSync } from 'child_process';
import chalk from 'chalk';
import { importAndTrack } from '../lib/importAndTrack.js';

export async function addPackage(pkgName) {
  console.log(chalk.cyan(`[stpm] Installing ${pkgName}...`));

  try {
    execSync(`npm install ${pkgName}`, { stdio: 'inherit' });
  } catch (err) {
    console.log(chalk.red(`❌ Failed to install ${pkgName}`));
    console.log(chalk.gray(`Error: ${err.message}`));
    return;
  }

  console.log(chalk.cyan(`[stpm] Importing files from ${pkgName}...`));
  // Import files and update manifest after install
  await importAndTrack(pkgName);
}