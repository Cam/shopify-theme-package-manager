import fs from 'fs-extra';
import path from 'path';

const MANIFEST_PATH = path.join(process.cwd(), '.stpm-imports.json');

export async function getManifest() {
  return await fs.readJson(MANIFEST_PATH).catch(() => ({}));
}

export async function updateManifest(pkgName, files) {
  const manifest = await getManifest();
  manifest[pkgName] = files;
  await fs.writeJson(MANIFEST_PATH, manifest, { spaces: 2 });
}

/**
 * Remove a package from the manifest and return its file list
 */

export async function removeFromManifest(pkgName) {
  const manifestPath = path.join(process.cwd(), '.stpm-imports.json');

  if (!await fs.pathExists(manifestPath)) return [];

  const manifest = await fs.readJson(manifestPath);
  const entry = manifest[pkgName];

  console.log('[stpm] Removing files for:', pkgName, entry);

  if (!entry || !Array.isArray(entry.files)) return [];

  const filePaths = entry.files;

  // Remove the entry from the manifest
  delete manifest[pkgName];
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  return filePaths;
}

/**
 * Remove a package from the manifest and return its file list
 */
export async function removeUninstalledPackages(pkgName) {
  const manifest = await getManifest();
  const files = manifest[pkgName] || [];
  delete manifest[pkgName];
  await fs.writeJson(MANIFEST_PATH, manifest, { spaces: 2 });
  return files;
}