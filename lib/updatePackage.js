import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { detectStpmNative } from './detectStpmNative.js';
import { validateSTPM } from './validateSTPM.js';
import { importNativePackage } from './importNativePackage.js';
import { importBundledPackage } from './importBundledPackage.js';
import { waitForPackageJson } from '../lib/utils.js';

export async function updatePackage(pkgNameRaw) {
  // Normalize casing early to avoid mismatches
  const pkgName = pkgNameRaw.toLowerCase();
  const manifestPath = path.join(process.cwd(), '.stpm-packages.json');

  // Load manifest and verify the package is currently imported
  const manifest = (await fs.pathExists(manifestPath)) ? await fs.readJson(manifestPath) : {};
  if (!manifest[pkgName]) {
    console.log(chalk.red(`[stpm] ${pkgNameRaw} is not currently imported.`));
    return;
  }

  // Store the manifest entry for later use
  const entry = manifest[pkgName];

  console.log(chalk.cyan(`[stpm] Updating ${pkgNameRaw}...`));

  // Reinstall the package using npm
  try {
    execSync(`npm install ${pkgName}`, { stdio: 'inherit' });
  } catch (err) {
    console.log(chalk.red(`❌ Failed to update ${pkgNameRaw}`));
    console.log(chalk.gray(`Error: ${err.message}`));
    return;
  }

  // Remove previous import artifacts
  const { cleanImportArtifacts } = await import('./removePackage.js');
  await cleanImportArtifacts(pkgName);
  console.log(chalk.cyan(`[stpm] Re-importing ${pkgNameRaw}...`));

  // Determine package root
  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);

  // Wait for package.json to appear after install
  const pkgJsonReady = await waitForPackageJson(pkgRoot);
  if (!pkgJsonReady) {
    console.log(chalk.red(`[stpm] Re-import failed: no package.json found for ${pkgNameRaw}`));
    return;
  }

  // Detect whether the package is STPM-native
  const isStpmNative = await detectStpmNative(pkgRoot);
  console.log(chalk.cyan(`[stpm] Detected ${pkgNameRaw} as ${isStpmNative ? 'STPM-native' : 'standard NPM module'}`));

  // Import based on detection result
  if (isStpmNative) {
    try {
      await validateSTPM(pkgRoot);
      await importNativePackage(pkgName);
    } catch (err) {
      console.log(chalk.red(`[stpm] ${pkgNameRaw} failed native validation after update.`));
      console.log(chalk.gray(`Details: ${err.message}`));
      console.log(chalk.yellow(`[stpm] Falling back to bundled import.`));
      await importBundledPackage(pkgName);
    }
  } else {
    await importBundledPackage(pkgName, entry);
  }

  console.log(chalk.green(`[stpm] Successfully updated and re-imported ${pkgNameRaw}`));
}