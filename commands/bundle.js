import chalk from 'chalk';
import { generateBundle } from '../lib/bundler.js';

export default async function bundleCommand() {
  console.log(chalk.blue(`[stpm] Bundling global JS and CSS...`));
  await generateBundle();
  console.log(chalk.blue(`[stpm] Bundle complete.`));
}