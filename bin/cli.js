#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { addPackage } from '../commands/add.js';
import importCommand from '../commands/import.js';
import cleanCommand from '../commands/clean.js';
import cleanAllCommand from '../commands/cleanAll.js';
import bundleCommand from '../commands/bundle.js';

const program = new Command();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

program
  .name('stpm')
  .description('Shopify Theme Package Manager (stpm)')
  .version(pkg.version);

program
  .command('add')
  .argument('<packages...>')
  .description('Install and import one or more theme-compatible packages')
  .action(async (packages) => {
    for (const pkg of packages) {
      await addPackage(pkg);
    }
  });

program
  .command('import <package>')
  .description('Import files from a theme package')
  .action(importCommand);

program
  .command('clean <package>')
  .description('Remove imported files from a package')
  .action(cleanCommand);

program
  .command('clean-all')
  .description('Remove files from all uninstalled packages')
  .action(cleanAllCommand);

program
  .command('bundle')
  .description('Compile global JS/CSS from selected packages')
  .action(bundleCommand);

program.parse(process.argv);