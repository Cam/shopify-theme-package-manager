// Warn if a package contains theme-like files but is not marked as STPM-native

import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';

export async function warnIfSTPMLike(pkgRoot, pkgName) {
  const themeDirs = ['sections', 'snippets', 'templates', 'locales', 'config'];
  const found = [];

  for (const dir of themeDirs) {
    if (await fs.pathExists(path.join(pkgRoot, dir))) {
      found.push(dir);
    }
  }

  const hasSchema = await fs.pathExists(path.join(pkgRoot, 'settings_schema.json'));
  if (hasSchema) found.push('settings_schema.json');

  if (found.length > 0) {
    log.warn(`${pkgName} contains theme-like files (${found.join(', ')}) but is not marked as STPM-native.`);
    log.info(`Consider adding "stpm": { "type": "native" } to its package.json.`);
  }
}