#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addCommand } from '../commands/add.js';
import { buildCommand } from '../commands/build.js';
import { removeCommand } from '../commands/remove.js';
import { updateCommand } from '../commands/update.js';
import { cleanCommand } from '../commands/clean.js';

// Determine current version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Setup CLI commands
const program = new Command();

program
  .name('stpm')
  .description('Shopify Theme Package Manager')
  .version(pkg.version);

program
  .command('add <package>')
  .description('Install and import a STPM-native package')
  .action(addCommand);

program
  .command('build')
  .description('Run full theme build')
  .action(buildCommand);

program
  .command('update <pkgName>')
  .description('Update an imported package and re-apply its STPM blocks')
  .action(updateCommand);

program
  .command('remove <package>')
  .description('Remove imported files, schema blocks, and uninstall package')
  .action(removeCommand);

program
  .command('clean')
  .description('Remove all STPM blocks from compiled assets and warn about duplicates')
  .action(cleanCommand);

program.parse(process.argv);