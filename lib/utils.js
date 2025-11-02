// Recurisve merge for locales and settings

import path from 'path';
import fs from 'fs-extra';

export function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Index blocks by name or type

export function indexByName(blocks) {
  const map = {};
  for (const block of blocks) {
    const key = block.name || block.type || `block_${Math.random().toString(36).slice(2)}`;
    map[key] = block;
  }
  return map;
}

// Delete a nested key path from an object and remove empty parents

export function deepDeleteKeyPath(obj, pathStr) {
  const keys = pathStr.split('.');
  const stack = [];

  let current = obj;
  for (const key of keys) {
    stack.push({ parent: current, key });
    current = current[key];
    if (current === undefined) return; // Key path doesn't exist
  }

  // Delete the deepest key
  const last = stack.pop();
  delete last.parent[last.key];

  // Walk back up and remove empty objects
  while (stack.length) {
    const { parent, key } = stack.pop();
    if (Object.keys(parent[key] || {}).length === 0) {
      delete parent[key];
    } else {
      break; // Stop if parent is not empty
    }
  }
}

// Remove locale keys from a JSON file

export async function removeLocaleKeys(filePath, keyPaths) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!(await fs.pathExists(fullPath))) return;

  const json = await fs.readJson(fullPath);
  for (const keyPath of keyPaths) {
    deepDeleteKeyPath(json, keyPath);
  }
  await fs.writeJson(fullPath, json, { spaces: 2 });
}

// Remove settings schema blocks

export async function removeSchemaBlocks(blocksToRemove) {
  const schemaPath = path.join(process.cwd(), 'config/settings_schema.json');
  if (!(await fs.pathExists(schemaPath))) return;

  const schema = await fs.readJson(schemaPath);
  const filtered = schema.filter(block => {
    return !blocksToRemove.some(toRemove =>
      (toRemove.name && block.name === toRemove.name) ||
      (toRemove.type && block.type === toRemove.type)
    );
  });

  await fs.writeJson(schemaPath, filtered, { spaces: 2 });
}

// Extract all key paths from a nested object

export function extractKeyPaths(obj, prefix = '') {
  const paths = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      paths.push(...extractKeyPaths(obj[key], fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}