import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { importPackage } from '../lib/importPackage.js';
import { importBundledPackage } from '../lib/importBundledPackage.js';
import { detectStpmNative } from '../lib/utils.js';

export async function addPackage(pkgName) {
  const manifestPath = path.join(process.cwd(), '.stpm-imports.json');
  const manifest = (await fs.pathExists(manifestPath)) ? await fs.readJson(manifestPath) : {};

  if (manifest[pkgName]) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `${pkgName} is already imported. What would you like to do?`,
        choices: [
          { name: 'Skip re-import', value: 'skip' },
          { name: 'Re-import and overwrite previous content', value: 'overwrite' },
          { name: 'Remove and re-add cleanly', value: 'reset' }
        ]
      }
    ]);

    if (action === 'skip') {
      console.log(chalk.yellow(`[stpm] Skipped re-import of ${pkgName}`));
      return;
    }

    if (action === 'reset') {
      const { removePackage } = await import('../lib/removePackage.js');
      await removePackage(pkgName);
    }
  }

  console.log(chalk.cyan(`[stpm] Installing ${pkgName}...`));

  try {
    execSync(`npm install ${pkgName}`, { stdio: 'inherit' });
  } catch (err) {
    console.log(chalk.red(`❌ Failed to install ${pkgName}`));
    console.log(chalk.gray(`Error: ${err.message}`));
    return;
  }

  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
  const isStpmNative = await detectStpmNative(pkgRoot);

  console.log(chalk.cyan(`[stpm] Detected ${pkgName} as ${isStpmNative ? 'STPM-native' : 'standard NPM module'}`));

  if (isStpmNative) {
    await importPackage(pkgName);
  } else {
    await importBundledPackage(pkgName);
  }
}