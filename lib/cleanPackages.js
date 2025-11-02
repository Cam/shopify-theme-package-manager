import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { normalizeFileSpacing } from './utils.js';

/**
 * Cleans duplicate STPM blocks from compiled assets, leaving one valid block per package.
 */
export async function cleanPackages() {
  const manifestPath = path.join(process.cwd(), '.stpm-packages.json');
  if (!(await fs.pathExists(manifestPath))) {
    console.log(chalk.yellow(`[stpm] No manifest found. Nothing to clean.`));
    return;
  }

  const manifest = await fs.readJson(manifestPath);
  const allAssets = new Set();

  // Collect all asset targets from all packages
  for (const entry of Object.values(manifest)) {
    for (const bundle of entry.bundled || []) {
      allAssets.add(bundle.output);
    }
    for (const asset of entry.assets || []) {
      allAssets.add(asset.target);
    }
  }

  // Clean each asset file
  for (const assetPathRel of allAssets) {
    const assetPath = path.join(process.cwd(), assetPathRel);
    if (!(await fs.pathExists(assetPath))) continue;

    let content = await fs.readFile(assetPath, 'utf8');
    const blockRegex = /\/\* STPM: START ([^*]+) \*\/\n[\s\S]*?\/\* STPM: END \1 \*\/\n?/g;

    const matches = [...content.matchAll(blockRegex)];
    const blocksByMarker = new Map();

    for (const match of matches) {
      const marker = match[1];
      if (!blocksByMarker.has(marker)) {
        blocksByMarker.set(marker, []);
      }
      blocksByMarker.get(marker).push(match[0]);
    }

    let cleaned = content;
    let totalRemoved = 0;

    for (const [marker, blocks] of blocksByMarker.entries()) {
      if (blocks.length > 1) {
        console.log(chalk.yellow(`[stpm] Duplicate blocks found for ${marker} in ${assetPathRel}`));
        // Remove all blocks
        for (const block of blocks) {
          cleaned = cleaned.replace(block, '');
        }
        // Re-add the first block
        cleaned += `\n${blocks[0]}`;
        totalRemoved += blocks.length - 1;
      }
    }

    if (totalRemoved > 0) {
      await fs.writeFile(assetPath, cleaned);
      await normalizeFileSpacing(assetPath);
      console.log(chalk.gray(`[stpm] Removed ${totalRemoved} duplicate block(s) from ${assetPathRel}`));
    }
  }

  console.log(chalk.green(`[stpm] ✅ Duplicate clean complete.`));
}