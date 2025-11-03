import { updatePackage } from '../lib/updatePackage.js';
import { log } from '../lib/logger.js';

export async function updateCommand(pkgName) {
  log(`Updating ${pkgName}...`); 
  await updatePackage(pkgName);
}