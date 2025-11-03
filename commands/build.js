import { buildPackages } from '../lib/buildPackages.js';
import { log } from '../lib/logger.js';

export async function buildCommand(pkgName) {
  log(`Building...`); 
  await buildPackages(pkgName);
}