#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import importCommand from '../commands/import.js';
import cleanCommand from '../commands/clean.js';
import cleanAllCommand from '../commands/cleanAll.js';
import bundleCommand from '../commands/bundle.js';

const program = new Command();

program
  .name('theme-tools')
  .description(chalk.cyan('Shopify Theme Tools CLI'))
  .version('1.0.0');

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