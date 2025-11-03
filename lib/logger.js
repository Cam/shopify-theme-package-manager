import chalk from 'chalk';

const boldPink = chalk.hex('#FF69B4').bold;
const prefix = boldPink('[STPM]');

function log(message) {
  console.log(chalk.grey(`${prefix} ${message}`));
}

log.success = (msg) => console.log(chalk.green(`${prefix} ✅ ${msg}`));
log.warn = (msg) => console.warn(chalk.yellow(`${prefix} ⚠️ ${msg}`));
log.error = (msg) => console.error(chalk.red(`${prefix} ❌ ${msg}`));
log.info = log; // alias for clarity

export { log };