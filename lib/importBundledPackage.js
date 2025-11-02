import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import esbuild from 'esbuild';
import inquirer from 'inquirer';

export async function importBundledPackage(pkgName) {
  const pkgRoot = path.join(process.cwd(), 'node_modules', pkgName);
  const pkgJsonPath = path.join(pkgRoot, 'package.json');

  if (!(await fs.pathExists(pkgJsonPath))) {
    console.log(chalk.red(`[stpm] No package.json found for ${pkgName}`));
    return;
  }

  const pkgJson = await fs.readJson(pkgJsonPath);
  const themeAssetsDir = path.join(process.cwd(), 'assets');
  const outputs = [];
  const marker = pkgName;

  // 🔍 Scan for any .css file in the root of the package
  const cssCandidates = (await fs.readdir(pkgRoot)).filter(f => f.endsWith('.css'));

  if (cssCandidates.length > 0) {
    const { cssEntry } = await inquirer.prompt([
      {
        type: 'list',
        name: 'cssEntry',
        message: `Select the main CSS file to bundle from ${pkgName}:`,
        choices: cssCandidates
      }
    ]);

    const cssEntryPath = path.join(pkgRoot, cssEntry);
    const css = await fs.readFile(cssEntryPath, 'utf8');
    const result = await postcss([postcssImport()]).process(css, { from: cssEntryPath });

    const { cssOut } = await inquirer.prompt([
      {
        type: 'input',
        name: 'cssOut',
        message: `Output file for bundled CSS from ${pkgName}:`,
        default: 'theme.css'
      }
    ]);

    const cssOutPath = path.join(themeAssetsDir, cssOut);
    const wrapped = `\n/* STPM: START ${marker} */\n${result.css}\n/* STPM: END ${marker} */\n`;
    await fs.appendFile(cssOutPath, wrapped);

    outputs.push({ type: 'css', source: cssEntry, output: `assets/${cssOut}`, marker });
    console.log(chalk.green(`[stpm] Bundled CSS → ${cssOut}`));
  }

  // 🔍 JS Entry: main or exports
  let jsEntry = pkgJson.main || (typeof pkgJson.exports === 'string' ? pkgJson.exports : null);

  // If no entry declared, scan for .js files in root
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

  // Bundle JS if entry found
  if (jsEntry) {
    const jsEntryPath = path.join(pkgRoot, jsEntry);
    if (await fs.pathExists(jsEntryPath)) {
      const { jsOut } = await inquirer.prompt([
        {
          type: 'input',
          name: 'jsOut',
          message: `Output file for bundled JS from ${pkgName}:`,
          default: 'theme.js'
        }
      ]);

      const jsOutPath = path.join(themeAssetsDir, jsOut);
      const tempOut = path.join(themeAssetsDir, `.tmp-${pkgName.replace(/[^a-z0-9]/gi, '_')}.js`);
      await esbuild.build({
        entryPoints: [jsEntryPath],
        bundle: true,
        outfile: tempOut,
        format: 'iife',
        minify: true
      });

      const jsContent = await fs.readFile(tempOut, 'utf8');
      const wrapped = `/* STPM: START ${marker} */\n${result.css}\n/* STPM: END ${marker} */\n`;
      await fs.appendFile(jsOutPath, wrapped);
      await fs.remove(tempOut);

      outputs.push({ type: 'js', source: jsEntry, output: `assets/${jsOut}`, marker });
      console.log(chalk.green(`[stpm] Bundled JS → ${jsOut}`));
    }
  }

  if (outputs.length === 0) {
    console.log(chalk.yellow(`[stpm] No CSS or JS entry points found in ${pkgName}`));
    return;
  }

  // 🧾 Update .stpm-imports.json
  const importsPath = path.join(process.cwd(), '.stpm-imports.json');
  const existing = (await fs.pathExists(importsPath)) ? await fs.readJson(importsPath) : {};
  existing[pkgName] = { bundled: outputs };
  await fs.writeJson(importsPath, existing, { spaces: 2 });

  console.log(chalk.cyan(`[stpm] Imported ${pkgName} as bundled package`));
}