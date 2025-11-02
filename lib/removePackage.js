import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { removeSchemaBlocks, removeLocaleKeys } from './utils.js';

export async function removePackage(pkgName) {
  const manifestPath = path.join(process.cwd(), '.stpm-imports.json');
  if (!(await fs.pathExists(manifestPath))) return;

  const manifest = await fs.readJson(manifestPath);
  const entry = manifest[pkgName];
  if (!entry) return;

  // 1a. Remove imported files (native STPM)
  for (const relPath of entry.files || []) {
    const fullPath = path.join(process.cwd(), relPath);
    if (await fs.pathExists(fullPath)) {
      await fs.remove(fullPath);
      console.log(chalk.gray(`[stpm] Removed file: ${relPath}`));
    }
  }

  // 1b. Remove bundled outputs (theme.css, theme.js, etc.)
  for (const bundle of entry.bundled || []) {
    const outPath = path.join(process.cwd(), bundle.output);
    if (!(await fs.pathExists(outPath))) continue;

    let content = await fs.readFile(outPath, 'utf8');
    const marker = bundle.marker || pkgName;

    // Match block exactly as written during import
    const blockRegex = new RegExp(
      `\\/\\* STPM: START ${marker} \\*\\/\\n[\\s\\S]*?\\/\\* STPM: END ${marker} \\*\\/\\n?`,
      'g'
    );

    const matches = content.match(blockRegex);

    if (matches && matches.length > 0) {
      content = content.replace(blockRegex, '');
      await fs.writeFile(outPath, content);
      console.log(chalk.gray(`[stpm] Removed ${matches.length} block(s) from ${bundle.output}`));
    } else {
      console.log(chalk.yellow(`[stpm] No matching block found in ${bundle.output}`));
    }
  }

  // 1c. Remove compiled blocks from theme.js/global.css
  for (const asset of entry.assets || []) {
    const targetPath = path.join(process.cwd(), asset.target);
    if (!(await fs.pathExists(targetPath))) continue;

    const content = await fs.readFile(targetPath, 'utf8');
    const startMarker = `/* STPM: START ${pkgName} ${asset.file} */`;
    const endMarker = `/* STPM: END ${pkgName} ${asset.file} */`;

    const regex = new RegExp(`\\n?${startMarker}[\\s\\S]*?${endMarker}\\n?`, 'g');
    const cleaned = content.replace(regex, '');

    await fs.writeFile(targetPath, cleaned);
    console.log(chalk.gray(`[stpm] Removed compiled block from ${asset.target}`));
  }

  // 2. Remove locale keys
  await removeLocaleKeys('locales/en.default.json', entry.locales?.frontend || []);
  await removeLocaleKeys('locales/en.default.schema.json', entry.locales?.schema || []);

  // 3. Remove settings schema blocks
  await removeSchemaBlocks(entry.settingsSchema || []);

  // 4. Uninstall npm package
  try {
    execSync(`npm uninstall ${pkgName}`, { stdio: 'inherit' });
    console.log(chalk.gray(`[stpm] Uninstalled ${pkgName}`));
  } catch (err) {
    console.warn(chalk.yellow(`[stpm] Failed to uninstall ${pkgName}: ${err.message}`));
  }

  // 5. Update manifest
  delete manifest[pkgName];
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
  console.log(chalk.green(`[stpm] ✅ Removed ${pkgName}`));
}