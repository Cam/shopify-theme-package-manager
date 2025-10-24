import chalk from 'chalk';
import { execa } from 'execa';
import { removeFromManifest } from '../lib/manifest.js';
import { deleteFiles } from '../lib/fileOps.js';

export default async function removeCommand(pkgName) {
  console.log(chalk.yellow(`[stpm] Cleaning files from ${pkgName}...`));

  const files = await removeFromManifest(pkgName);

  if (!Array.isArray(files)) {
    console.error(chalk.red(`[stpm] No valid file list found for ${pkgName}.`));
    return;
  }

  await deleteFiles(files);
  console.log(chalk.yellow(`[stpm] Removed ${files.length} files.`));

  // Uninstall the npm package
  try {
    await execa('npm', ['uninstall', pkgName]);
    console.log(chalk.yellow(`[stpm] Uninstalled ${pkgName} from package.json.`));
  } catch (err) {
    console.error(chalk.red(`[stpm] Failed to uninstall ${pkgName}: ${err.message}`));
  }
}