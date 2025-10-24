import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import resolve from 'resolve';
import chalk from 'chalk';

// Shopify folder mapping for Liquid tags
const LIQUID_MAP = {
  snippet: 'snippets',
  section: 'sections',
  template: 'templates',
  layout: 'layout',
};

// Supported file types for import
const SUPPORTED_EXTENSIONS = ['.liquid', '.js', '.css', '.svg', '.png', '.jpg', '.json'];

// Files to exclude from import (registry metadata)
const EXCLUDED_FILES = ['package.json', 'README.md', 'LICENSE', '.gitignore', '.npmignore'];

/**
 * Generate a SHA-1 hash from file content
 */
function hashContent(content) {
  return crypto.createHash('sha1').update(content).digest('hex');
}

/**
 * Parse Liquid file for Shopify doc tag (supports {% doc %} and {% comment %})
 * Logs a warning if legacy {% comment %} is used
 */
function parseLiquidTag(content, relPath, pkgName) {
  let match = content.match(/{%\s*doc\s*%}([\s\S]*?){%\s*enddoc\s*%}/);
  let legacyUsed = false;

  if (!match) {
    match = content.match(/{%\s*comment\s*%}([\s\S]*?){%\s*endcomment\s*%}/);
    if (match) legacyUsed = true;
  }

  if (!match) return null;

  const lines = match[1].split('\n');
  for (const line of lines) {
    const tagMatch = line.trim().match(/^@(\w+)\s+([\w-]+)/);
    if (tagMatch) {
      if (legacyUsed) {
        console.log(chalk.yellow(`⚠️  Legacy tag used in ${pkgName}/${relPath}`));
      }
      return { type: tagMatch[1], name: tagMatch[2] };
    }
  }

  return null;
}

/**
 * Import a single file into the correct Shopify folder
 */
async function importFile(pkgName, filePath, relPath, fileCache) {
  const ext = path.extname(filePath);
  const content = await fs.readFile(filePath, 'utf8');
  const hash = hashContent(content);

  const prevHash = fileCache[pkgName]?.[relPath];
  if (prevHash === hash) {
    console.log(chalk.gray(`⚠️  Skipped: ${pkgName}/${relPath} (unchanged)`));
    return null;
  }

  let destFolder = null;
  if (ext === '.liquid') {
    const tag = parseLiquidTag(content, relPath, pkgName);
    if (tag && LIQUID_MAP[tag.type]) {
      destFolder = LIQUID_MAP[tag.type];
    }
  } else if (SUPPORTED_EXTENSIONS.includes(ext)) {
    destFolder = 'assets';
  }

  if (!destFolder) {
    console.log(chalk.yellow(`⚠️  Skipped: ${pkgName}/${relPath} (unsupported or missing tag)`));
    return null;
  }

  const destPath = path.join(process.cwd(), destFolder, path.basename(relPath));

  // Warn if file already exists in destination
  if (await fs.pathExists(destPath)) {
    console.log(chalk.yellow(`⚠️  Warning: ${destFolder}/${path.basename(relPath)} already exists. Overwriting.`));
  }

  await fs.copy(filePath, destPath);
  console.log(chalk.green(`✅ Imported: ${pkgName}/${relPath} → ${destFolder}/`));

  return { relPath, hash };
}

/**
 * Recursively scan a package folder and import supported files
 */
export async function scanPackage(pkgName, fileCache = {}) {
  console.log(chalk.cyan(`[theme-tools] Importing files from ${pkgName}...`));

  let pkgPath;
  try {
    pkgPath = path.dirname(
      resolve.sync(`${pkgName}/package.json`, { basedir: process.cwd() })
    );
  } catch (err) {
    console.log(chalk.red(`❌ Cannot resolve ${pkgName}`));
    console.log(chalk.gray(`Error: ${err.message}`));
    return [];
  }

  const importedFiles = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(pkgPath, fullPath);
      const ext = path.extname(entry.name);

      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        await walk(fullPath);
      } else if (
        SUPPORTED_EXTENSIONS.includes(ext) &&
        !EXCLUDED_FILES.includes(entry.name)
      ) {
        const result = await importFile(pkgName, fullPath, relPath, fileCache);
        if (result) {
          fileCache[pkgName] ||= {};
          fileCache[pkgName][relPath] = result.hash;
          importedFiles.push(relPath);
        }
      }
    }
  }

  await walk(pkgPath);
  
  console.log(chalk.green(`[theme-tools] Imported ${importedFiles.length} files.`));
  return importedFiles;
}

/**
 * Delete a list of relative file paths from the theme root
 */
export async function deleteFiles(filePaths) {
  for (const relPath of filePaths) {
    const fullPath = path.join(process.cwd(), relPath);
    try {
      await fs.remove(fullPath);
      console.log(chalk.red(`🗑️  Deleted: ${relPath}`));
    } catch (err) {
      console.warn(chalk.yellow(`⚠️  Failed to delete: ${relPath}`), err.message);
    }
  }
}