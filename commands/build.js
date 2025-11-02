import { buildPackages } from '../lib/buildPackages.js';

export async function buildCommand(pkgName) {
  console.log(`[stpm] Building...`);
  await buildPackages(pkgName);
}