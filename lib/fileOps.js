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
 * Imports a single file from a package into the project and returns metadata for tracking.
 * @param {string} pkgName - The name of the npm package being imported.
 * @param {string} filePath - Absolute path to the source file inside the package.
 * @param {string} relPath - Relative path from the package root to the file.
 * @param {object} fileCache - Optional cache to skip unchanged files.
 * @returns {object|null} - Metadata including hash and targetPath, or null if skipped.
 */
export async function importFile(pkgName, filePath, relPath, fileCache) {
  const ext = path.extname(filePath);
  const content = await fs.readFile(filePath, 'utf8');
  const hash = hashContent(content);

  // Skip if file hasn't changed
  const prevHash = fileCache[pkgName]?.[relPath];
  if (prevHash === hash) {
    console.log(chalk.gray(`⚠️  Skipped: ${pkgName}/${relPath} (unchanged)`));
    return null;
  }

  // Determine destination folder based on file type
  let destFolder = null;
  if (ext === '.liquid') {
    const tag = parseLiquidTag(content, relPath, pkgName);
    if (tag && LIQUID_MAP[tag.type]) {
      destFolder = LIQUID_MAP[tag.type];
    }
  } else if (SUPPORTED_EXTENSIONS.includes(ext)) {
    destFolder = 'assets';
  }

  // Skip unsupported files
  if (!destFolder) {
    console.log(chalk.yellow(`⚠️  Skipped: ${pkgName}/${relPath} (unsupported or missing tag)`));
    return null;
  }

  // Build full destination path
  const destPath = path.join(process.cwd(), destFolder, path.basename(relPath));

  // Warn if overwriting
  if (await fs.pathExists(destPath)) {
    console.log(chalk.yellow(`⚠️  Warning: ${destFolder}/${path.basename(relPath)} already exists. Overwriting.`));
  }

  // Copy file to destination
  await fs.copy(filePath, destPath);
  console.log(chalk.green(`✅ Imported: ${pkgName}/${relPath} → ${destFolder}/`));

  // ✅ Return metadata including destination path for manifest tracking
  return {
    relPath,
    hash,
    targetPath: destPath
  };
}

/**
 * Recursively scan a package folder and import supported files
 */
export async function scanPackage(pkgName, fileCache = {}) {
  console.log(chalk.cyan(`[stpm] Importing files from ${pkgName}...`));

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
      const ext = path.extname(entry.name);

      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        await walk(fullPath);
      } else if (
        SUPPORTED_EXTENSIONS.includes(ext) &&
        !EXCLUDED_FILES.includes(entry.name)
      ) {
        const relPathFromPkg = path.relative(pkgPath, fullPath);
        const result = await importFile(pkgName, fullPath, relPathFromPkg, fileCache);

        if (result) {
          fileCache[pkgName] ||= {};
          fileCache[pkgName][relPathFromPkg] = result.hash;

          // ✅ Track path relative to project root (where file was copied)
          const relPathFromProject = path.relative(process.cwd(), result.targetPath);
          console.log('[stpm] Tracking:', relPathFromProject);
          importedFiles.push(relPathFromProject);
        }
      }
    }
  }

  await walk(pkgPath);

  console.log(chalk.green(`[stpm] Imported ${importedFiles.length} files.`));
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