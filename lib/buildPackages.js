import fs from 'fs-extra';
import path from 'path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import esbuild from 'esbuild';
import { importNativePackage } from './importNativePackage.js';
import { normalizeFileSpacing } from '../lib/utils.js';
import { log } from './logger.js';

export async function buildPackages() {
  const manifestPath = path.join(process.cwd(), '.stpm-packages.json');
  const manifest = (await fs.pathExists(manifestPath)) ? await fs.readJson(manifestPath) : {};

  const pkgNames = Object.keys(manifest);
  if (pkgNames.length === 0) {
    log.warn(`No packages found in manifest.`);
    return;
  }

  for (const pkgName of pkgNames) {
    const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
    // Store the manifest entry for later use
    const entry = manifest[pkgName];
    const marker = pkgName;

    if (entry.native) {
      log.info(`Rebuilding ${pkgName} as STPM-native...`);
      await importNativePackage(pkgName);
      continue;
    }

    if (entry.bundled) {
      log.info(`Rebuilding ${pkgName} as bundled...`);
      for (const item of entry.bundled) {
        const sourcePath = path.join(pkgRoot, item.source);
        const outputPath = path.join(process.cwd(), item.output);

        // 🧹 Remove any existing block for this package before appending
        if (await fs.pathExists(outputPath)) {
          let existing = await fs.readFile(outputPath, 'utf8');
          const blockRegex = new RegExp(
            `\\/\\* STPM: START ${marker} \\*\\/\\n[\\s\\S]*?\\/\\* STPM: END ${marker} \\*\\/\\n?`,
            'g'
          );
          existing = existing.replace(blockRegex, '');
          await fs.writeFile(outputPath, existing);
        }

        if (item.type === 'css') {
          const css = await fs.readFile(sourcePath, 'utf8');
          const result = await postcss([postcssImport()]).process(css, { from: sourcePath });
          const wrapped = `\n/* STPM: START ${marker} */\n${result.css}\n/* STPM: END ${marker} */\n`;
          await fs.appendFile(outputPath, wrapped);
          await normalizeFileSpacing(outputPath);
          log.success(`Rebuilt CSS → ${item.output}`);
        }

        if (item.type === 'js') {
          const tempOut = outputPath + `.tmp`;
          await esbuild.build({
            entryPoints: [sourcePath],
            bundle: true,
            outfile: tempOut,
            format: 'iife',
            minify: true
          });

          const jsContent = await fs.readFile(tempOut, 'utf8');
          const wrapped = `\n/* STPM: START ${marker} */\n${jsContent}\n/* STPM: END ${marker} */\n`;
          await fs.appendFile(outputPath, wrapped);
          await fs.remove(tempOut);
          await normalizeFileSpacing(outputPath);
          log.success(`Rebuilt JS → ${item.output}`);
        }
      }
    }
  }

  log.success(`Build complete.`);
}