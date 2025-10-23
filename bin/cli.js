#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);
const root = process.cwd();
const importerPath = path.join(root, 'import.mjs');

// If importer doesn't exist, copy it from the package
if (!fs.existsSync(importerPath)) {
  const source = path.join(__dirname, '../lib/import.mjs');
  fs.copyFileSync(source, importerPath);
  console.log('✅ import.mjs added to project root');
}

// Add scripts to package.json
const pkgPath = path.join(root, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.scripts ||= {};
  pkg.scripts.import = 'node import.mjs';
  pkg.scripts['import:clear'] = 'node import.mjs --clear';
  pkg.scripts['import:help'] = 'echo "Usage:\\n  npm run import         → Import updated files\\n  npm run import:clear   → Clear cache and re-import all\\n  npm run import:help    → Show this help message"';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('✅ Scripts added to package.json');
}

console.log('\n🎉 Shopify Theme Tools installed!');
console.log('Run: npm run import');