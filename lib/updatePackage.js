import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import { detectStpmNative } from './detectStpmNative.js';
import { validateSTPM } from './validateSTPM.js';
import { importNativePackage } from './importNativePackage.js';
import { importBundledPackage } from './importBundledPackage.js';
import { waitForPackageJson } from '../lib/utils.js';
import { log } from './logger.js';

export async function updatePackage(pkgNameRaw) {
  // Normalize casing early to avoid mismatches
  const pkgName = pkgNameRaw.toLowerCase();
  const manifestPath = path.join(process.cwd(), '.stpm-packages.json');

  // Load manifest and verify the package is currently imported
  const manifest = (await fs.pathExists(manifestPath)) ? await fs.readJson(manifestPath) : {};
  if (!manifest[pkgName]) {
    log.error(`${pkgNameRaw} is not currently imported.`);
    return;
  }

  // Store the manifest entry for later use
  const entry = manifest[pkgName];

  log.info(`Updating ${pkgNameRaw}...`);

  // Reinstall the package using npm
  try {
    execSync(`npm install ${pkgName}`, { stdio: 'inherit' });
  } catch (err) {
    log.error(`Failed to update ${pkgNameRaw}`);
    log.error(`Error: ${err.message}`);
    return;
  }

  // Remove previous import artifacts
  const { cleanImportArtifacts } = await import('./removePackage.js');
  await cleanImportArtifacts(pkgName);
  log.info(`Re-importing ${pkgNameRaw}...`);

  // Determine package root
  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);

  // Wait for package.json to appear after install
  const pkgJsonReady = await waitForPackageJson(pkgRoot);
  if (!pkgJsonReady) {
    log.error(`Re-import failed: no package.json found for ${pkgNameRaw}`);
    return;
  }

  // Detect whether the package is STPM-native
  const isStpmNative = await detectStpmNative(pkgRoot);
  log.info(`Detected ${pkgNameRaw} as ${isStpmNative ? 'STPM-native' : 'standard NPM module'}`);

  // Import based on detection result
  if (isStpmNative) {
    try {
      await validateSTPM(pkgRoot);
      await importNativePackage(pkgName);
    } catch (err) {
      log.error(`${pkgNameRaw} failed native validation after update.`);
      log.error(`Details: ${err.message}`);
      log.warn(`Falling back to bundled import.`);
      await importBundledPackage(pkgName);
    }
  } else {
    await importBundledPackage(pkgName, entry);
  }

  log.success(`Successfully updated and re-imported ${pkgNameRaw}`);
}