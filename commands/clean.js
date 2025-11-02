import { cleanPackages } from '../lib/cleanPackages.js';

export async function cleanCommand(pkgName) {
  console.log(`[stpm] cleaning...`);
  await cleanPackages(pkgName);
}