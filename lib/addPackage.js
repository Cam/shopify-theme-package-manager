import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { importNativePackage } from '../lib/importNativePackage.js';
import { importBundledPackage } from '../lib/importBundledPackage.js';
import { detectStpmNative } from '../lib/detectStpmNative.js';
import { warnIfSTPMLike } from '../lib/warnIfSTPMLike.js';
import { validateSTPM } from '../lib/validateSTPM.js';
import { log } from '../lib/logger.js';

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
      log.warn(`Skipped re-import of ${pkgName}`); 
      return;
    }

    const { removePackage } = await import('../lib/removePackage.js');
    await removePackage(pkgName);
  }

  log(`Installing ${pkgName}...`);

  try {
    const installTarget = `${pkgName}@latest`;
    execSync(`npm install ${installTarget} --save`, { stdio: 'inherit' });
  } catch (err) {
    log.error(`❌ Failed to install ${pkgName}`);
    log(`Error: ${err.message}`);
    return;
  }

  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
  const isStpmNative = await detectStpmNative(pkgRoot);

  log(`Detected ${pkgName} as ${isStpmNative ? 'STPM-native' : 'standard NPM module'}`);

  if (isStpmNative) {
    try {
      await validateSTPM(pkgRoot);
      await importNativePackage(pkgName);
    } catch (err) {
      log.error(`${pkgName} is marked as STPM-native but failed validation.`);
      log(`Details: ${err.message}`);
      log.warn(`Falling back to bundled import.`);

      await importBundledPackage(pkgName);
    }
  } else {
    await importBundledPackage(pkgName);
  }

  if (!isStpmNative) {
    await warnIfSTPMLike(pkgRoot, pkgName);
  }
}