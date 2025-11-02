// Bundles JS/CSS from declared entry points

import fs from 'fs-extra';
import path from 'path';
import esbuild from 'esbuild';

export async function compileAssets() {
  const configPath = path.join(process.cwd(), '.stpm-packages.json');
  if (!(await fs.pathExists(configPath))) return;

  const config = await fs.readJson(configPath);
  const entries = config.assets || [];

  for (const { input, output } of entries) {
    console.log(`[stpm] Compiling ${input} → ${output}`);
    await esbuild.build({
      entryPoints: [input],
      outfile: path.join(process.cwd(), output),
      bundle: true,
      minify: true
    });
  }
}