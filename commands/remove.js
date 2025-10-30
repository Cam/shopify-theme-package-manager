import { removePackage } from '../lib/removePackage.js';

export async function removeCommand(pkgName) {
  console.log(`[stpm] Removing ${pkgName}...`);
  await removePackage(pkgName);
}