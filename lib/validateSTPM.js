// Validate that a package declared as STPM-native has required structure

import fs from 'fs-extra';
import path from 'path';
import { log } from './logger.js';

export async function validateSTPM(pkgRoot) {
  const requiredDirs = ['sections', 'snippets', 'templates', 'locales', 'config'];
  const hasThemeDir = await Promise.any(
    requiredDirs.map(dir => fs.pathExists(path.join(pkgRoot, dir)))
  ).catch(() => false);

  const hasSchema = await fs.pathExists(path.join(pkgRoot, 'settings_schema.json'));

  if (!hasThemeDir && !hasSchema) {
    log.error('Package declared as STPM-native but lacks theme folders or settings_schema.json in package root');
    throw new Error('STPM validation failed'); 
  }
}