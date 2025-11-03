import { cleanPackages } from '../lib/cleanPackages.js';
import { log } from '../lib/logger.js';

export async function cleanCommand(pkgName) {
  log(`Cleaning...`); 
  await cleanPackages(pkgName);
}