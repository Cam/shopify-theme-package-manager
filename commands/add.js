import { addPackage } from '../lib/addPackage.js';

export async function addCommand(pkgName) {
  console.log(`[stpm] Adding ${pkgName}...`);
  await addPackage(pkgName);
}