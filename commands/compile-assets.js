import chalk from 'chalk';
import { compileAssets } from '../lib/compileAssets.js';

export async function compileAssetsCommand() {
  console.log(chalk.cyan(`[stpm] Compiling asset entry points...`));
  await compileAssets();
}