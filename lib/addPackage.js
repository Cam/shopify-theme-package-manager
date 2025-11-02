import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { importNativePackage } from '../lib/importNativePackage.js';
import { importBundledPackage } from '../lib/importBundledPackage.js';
import { detectStpmNative } from '../lib/detectStpmNative.js';
import { warnIfSTPMLike } from '../lib/warnIfSTPMLike.js';
import { validateSTPM } from '../lib/validateSTPM.js';

export async function addPackage(pkgNameRaw) {
  const pkgName = pkgNameRaw.toLowerCase();
  const manifestPath = path.join(process.cwd(), '.stpm-packages.json');
  const manifest = (await fs.pathExists(manifestPath)) ? await fs.readJson(manifestPath) : {};

  if (manifest[pkgName]) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `${pkgName} is already imported. What would you like to do?`,
        choices: [
          { name: 'Skip re-import', value: 'skip' },
          { name: 'Remove and re-add (clean import)', value: 'reset' }
        ]
      }
    ]);

    if (action === 'skip') {
      console.log(chalk.yellow(`[stpm] Skipped re-import of ${pkgName}`));
      return;
    }

    const { removePackage } = await import('../lib/removePackage.js');
    await removePackage(pkgName);
  }

  console.log(chalk.cyan(`[stpm] Installing ${pkgName}...`));

  try {
    const installTarget = `${pkgName}@latest`;
    execSync(`npm install ${installTarget} --save`, { stdio: 'inherit' });
  } catch (err) {
    console.log(chalk.red(`❌ Failed to install ${pkgName}`));
    console.log(chalk.gray(`Error: ${err.message}`));
    return;
  }

  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
  const isStpmNative = await detectStpmNative(pkgRoot);

  console.log(chalk.cyan(`[stpm] Detected ${pkgName} as ${isStpmNative ? 'STPM-native' : 'standard NPM module'}`));

  if (isStpmNative) {
    try {
      await validateSTPM(pkgRoot);
      await importNativePackage(pkgName);
    } catch (err) {
      console.log(chalk.red(`[stpm] ${pkgName} is marked as STPM-native but failed validation.`));
      console.log(chalk.gray(`Details: ${err.message}`));
      console.log(chalk.yellow(`[stpm] Falling back to bundled import.`));
      await importBundledPackage(pkgName);
    }
  } else {
    await importBundledPackage(pkgName);
  }

  if (!isStpmNative) {
    await warnIfSTPMLike(pkgRoot, pkgName);
  }
}