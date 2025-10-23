import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import chalk from 'chalk';

// Setup CommonJS-style require inside ESM
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Cache file paths
const CACHE_DIR = path.join(__dirname, '.theme-import');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const PACKAGE_FILE = path.join(CACHE_DIR, 'packages.json');

// Parse CLI arguments
const args = process.argv.slice(2);
const clearCache = args.includes('--clear');

// Clear cache if requested
if (clearCache) {
  await fs.remove(CACHE_FILE);
  await fs.remove(PACKAGE_FILE);
  console.log(chalk.blue('🧹 Cache cleared. Re-importing all packages...'));
}

// Load caches or initialize empty
await fs.ensureDir(CACHE_DIR);
const fileCache = await fs.readJson(CACHE_FILE).catch(() => ({}));
const packageCache = await fs.readJson(PACKAGE_FILE).catch(() => ({}));

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
  // Try {% doc %} block first
  let match = content.match(/{%\s*doc\s*%}([\s\S]*?){%\s*enddoc\s*%}/);
  let legacyUsed = false;

  // Fallback to {% comment %} block if no {% doc %} found
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
        console.log(chalk.yellow(`⚠️  Legacy tag used in ${pkgName}/${relPath} — consider switching to {% doc %}`));
      }
      return { type: tagMatch[1], name: tagMatch[2] };
    }
  }

  return null;
}

/**
 * Import a single file into the correct Shopify folder
 */
async function importFile(pkgName, filePath, relPath) {
  const ext = path.extname(filePath);
  const content = await fs.readFile(filePath, 'utf8');
  const hash = hashContent(content);

  const prevHash = fileCache[pkgName]?.[relPath];
  if (prevHash === hash && !clearCache) {
    console.log(chalk.gray(`⚠️  Skipped: ${pkgName}/${relPath} (unchanged)`));
    return;
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
    return;
  }

  const destPath = path.join(process.cwd(), destFolder, path.basename(relPath));
  await fs.copy(filePath, destPath);
  console.log(chalk.green(`✅ Imported: ${pkgName}/${relPath} → ${destFolder}/`));

  fileCache[pkgName] ||= {};
  fileCache[pkgName][relPath] = hash;
}

/**
 * Recursively scan a package folder and import supported files
 */
async function scanPackage(pkgName) {
  let pkgPath;
  try {
    pkgPath = path.dirname(require.resolve(`${pkgName}/package.json`));
  } catch {
    console.log(chalk.red(`❌ Cannot resolve ${pkgName}`));
    return;
  }

  const stat = await fs.stat(pkgPath);
  const lastModified = stat.mtimeMs;
  if (packageCache[pkgName] === lastModified && !clearCache) {
    console.log(chalk.gray(`📦 Skipped: ${pkgName} (unchanged)`));
    return;
  }

  /**
   * Walk through package directory recursively
   */
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
        await importFile(pkgName, fullPath, relPath);
      }
    }
  }

  await walk(pkgPath);
  packageCache[pkgName] = lastModified;
}

/**
 * Main runner: scans all dependencies and imports files
 */
async function run() {
  const pkgRaw = await fs.readFile(path.join(__dirname, 'package.json'), 'utf8');
  const pkg = JSON.parse(pkgRaw);
  const dependencies = Object.keys(pkg.dependencies || {});

  for (const dep of dependencies) {
    await scanPackage(dep);
  }

  await fs.writeJson(CACHE_FILE, fileCache, { spaces: 2 });
  await fs.writeJson(PACKAGE_FILE, packageCache, { spaces: 2 });
}

run();