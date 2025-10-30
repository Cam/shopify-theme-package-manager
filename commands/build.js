import chalk from 'chalk';
import { compileAssets } from '../lib/compileAssets.js';

export async function buildCommand() {
  console.log(chalk.cyan(`[stpm] Running full build...`));
  await compileAssets();
  // Future: run other build steps here
}