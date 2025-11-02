// Detect if a package is an STPM native package

import fs from 'fs-extra';
import path from 'path';

export async function detectStpmNative(pkgRoot) {
  const pkgJsonPath = path.join(pkgRoot, 'package.json');
  if (!(await fs.pathExists(pkgJsonPath))) return false;

  const pkgJson = await fs.readJson(pkgJsonPath);
  return pkgJson.stpm?.type === 'native';
}