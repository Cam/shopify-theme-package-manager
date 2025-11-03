import fs from 'fs-extra';
import path from 'path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import esbuild from 'esbuild';
import inquirer from 'inquirer';
import { normalizeFileSpacing } from '../lib/utils.js';
import { log } from './logger.js';

/**
 * Imports a bundled package by processing its CSS and JS assets.
 * If manifestEntry is provided, skips prompts and uses stored config.
 */
export async function importBundledPackage(pkgName, manifestEntry = null) {
  try {
    const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
    const pkgJsonPath = path.join(pkgRoot, 'package.json');

    if (!(await fs.pathExists(pkgJsonPath))) {
      log.error(`Failed to import ${pkgName}: package.json is missing.`);
      return;
    }

    const pkgJson = await fs.readJson(pkgJsonPath);
    const themeAssetsDir = path.join(process.cwd(), 'assets');
    const outputs = [];
    const marker = pkgName;

    // 🔍 CSS
    const cssCandidates = (await fs.readdir(pkgRoot)).filter(f => f.endsWith('.css'));
    if (cssCandidates.length > 0) {
      let cssEntry = manifestEntry?.bundled?.find(b => b.type === 'css')?.source;

      // Prompt only if no entry in manifest
      if (!cssEntry) {
        const { cssEntry: selected } = await inquirer.prompt([
          {
            type: 'list',
            name: 'cssEntry',
            message: `Select the main CSS file to bundle from ${pkgName}:`,
            choices: cssCandidates
          }
        ]);
        cssEntry = selected;
      }

      const cssEntryPath = path.join(pkgRoot, cssEntry);
      const css = await fs.readFile(cssEntryPath, 'utf8');
      const result = await postcss([postcssImport()]).process(css, { from: cssEntryPath });

      let cssOut = manifestEntry?.bundled?.find(b => b.type === 'css')?.output?.replace(/^assets\//, '');

      if (!cssOut) {
        const { cssOut: selectedOut } = await inquirer.prompt([
          {
            type: 'input',
            name: 'cssOut',
            message: `Output file for bundled CSS from ${pkgName}:`,
            default: 'theme.css'
          }
        ]);
        cssOut = selectedOut;
      }

      const cssOutPath = path.join(themeAssetsDir, cssOut);
      const wrapped = `\n/* STPM: START ${marker} */\n${result.css}\n/* STPM: END ${marker} */\n`;

      // 🧹 Remove old STPM block before appending new CSS
      if (await fs.pathExists(cssOutPath)) {
        let existingCss = await fs.readFile(cssOutPath, 'utf8');
        const blockRegex = new RegExp(
          `\\/\\* STPM: START ${marker} \\*\\/\\n[\\s\\S]*?\\/\\* STPM: END ${marker} \\*\\/\\n?`,
          'g'
        );
        existingCss = existingCss.replace(blockRegex, '');
        await fs.writeFile(cssOutPath, existingCss); // overwrite without old block
      }

      await fs.appendFile(cssOutPath, wrapped);
      await normalizeFileSpacing(cssOutPath);

      outputs.push({ type: 'css', source: cssEntry, output: `assets/${cssOut}` });
      log.success(`Bundled CSS → ${cssOut}`);
    }

    // 🔍 JS
    let jsEntry = manifestEntry?.bundled?.find(b => b.type === 'js')?.source;
    if (!jsEntry) {
      jsEntry = pkgJson.main || (typeof pkgJson.exports === 'string' ? pkgJson.exports : null);
    }

    if (!jsEntry) {
      const jsCandidates = (await fs.readdir(pkgRoot)).filter(f => f.endsWith('.js'));
      if (jsCandidates.length > 0) {
        const { selectedJs } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedJs',
            message: `Select the main JS file to bundle from ${pkgName}:`,
            choices: jsCandidates
          }
        ]);
        jsEntry = selectedJs;
      }
    }

    if (jsEntry) {
      const jsEntryPath = path.join(pkgRoot, jsEntry);
      if (await fs.pathExists(jsEntryPath)) {
        let jsOut = manifestEntry?.bundled?.find(b => b.type === 'js')?.output?.replace(/^assets\//, '');

        if (!jsOut) {
          const { jsOut: selectedOut } = await inquirer.prompt([
            {
              type: 'input',
              name: 'jsOut',
              message: `Output file for bundled JS from ${pkgName}:`,
              default: 'theme.js'
            }
          ]);
          jsOut = selectedOut;
        }

        const jsOutPath = path.join(themeAssetsDir, jsOut);
        const tempOut = path.join(themeAssetsDir, `.tmp-${pkgName.replace(/[^a-z0-9]/gi, '_')}.js`);
        await esbuild.build({
          entryPoints: [jsEntryPath],
          bundle: true,
          outfile: tempOut,
          format: 'iife',
          minify: false
        });

        const jsContent = await fs.readFile(tempOut, 'utf8');
        const wrapped = `\n/* STPM: START ${marker} */\n${jsContent}\n/* STPM: END ${marker} */\n`;

        // 🧹 Remove old STPM block before appending new JS
        if (await fs.pathExists(jsOutPath)) {
          let existingJs = await fs.readFile(jsOutPath, 'utf8');
          const blockRegex = new RegExp(
            `\\/\\* STPM: START ${marker} \\*\\/\\n[\\s\\S]*?\\/\\* STPM: END ${marker} \\*\\/\\n?`,
            'g'
          );
          existingJs = existingJs.replace(blockRegex, '');
          await fs.writeFile(jsOutPath, existingJs); // overwrite without old block
        }
        
        await fs.appendFile(jsOutPath, wrapped);
        await normalizeFileSpacing(jsOutPath);
        await fs.remove(tempOut);

        outputs.push({ type: 'js', source: jsEntry, output: `assets/${jsOut}` });
        log.success(`Bundled JS → ${jsOut}`);
      }
    }

    if (outputs.length === 0) {
      log.warn(`No CSS or JS entry points found in ${pkgName}`);
      return;
    }

    // 🧾 Update .stpm-packages.json
    const importsPath = path.join(process.cwd(), '.stpm-packages.json');
    const existing = (await fs.pathExists(importsPath)) ? await fs.readJson(importsPath) : {};
    existing[pkgName] = { bundled: outputs };
    await fs.writeJson(importsPath, existing, { spaces: 2 });

    log.success(`Imported ${pkgName} as bundled package`);
  } catch (err) {
    log.error(`Failed to import ${pkgName}`);
    log.error(`Error: ${err.message}`);
  }
}