import { updatePackage } from '../lib/updatePackage.js';

export async function updateCommand(pkgName) {
  console.log(`[stpm] Updating ${pkgName}...`);
  await updatePackage(pkgName);
}