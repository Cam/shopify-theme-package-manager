import { removePackage } from '../lib/removePackage.js';
import { log } from '../lib/logger.js';

export async function removeCommand(pkgName) {
  log(`Removing ${pkgName}...`); 
  await removePackage(pkgName);
}