import { addPackage } from '../lib/addPackage.js';
import { log } from '../lib/logger.js';

export async function addCommand(pkgName) {
  log(`Adding ${pkgName}...`); 
  await addPackage(pkgName);
}