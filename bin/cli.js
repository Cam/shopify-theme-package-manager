#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addPackage } from '../commands/add.js';
import { compileAssetsCommand } from '../commands/compile-assets.js';
import { buildCommand } from '../commands/build.js';
import { removeCommand } from '../commands/remove.js';

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
  .action(addPackage);

program
  .command('compile-assets')
  .description('Compile JS/CSS from declared entry points')
  .action(compileAssetsCommand);

program
  .command('build')
  .description('Run full theme build')
  .action(buildCommand);

program
  .command('remove <package>')
  .description('Remove imported files, schema blocks, and uninstall package')
  .action(removeCommand);

program.parse(process.argv);