// Merges locales and settings schema

import fs from 'fs-extra';
import path from 'path';
import { deepMerge, indexByName } from './utils.js';
import { log } from './logger.js';

export async function mergeFrontendLocales(fragment) {
  const pathToFile = path.join(process.cwd(), 'locales/en.default.json');
  const existing = (await fs.pathExists(pathToFile)) ? await fs.readJson(pathToFile) : {};
  const merged = deepMerge(existing, fragment);
  await fs.writeJson(pathToFile, merged, { spaces: 2 });
}

export async function mergeSchemaLocales(fragment) {
  const pathToFile = path.join(process.cwd(), 'locales/en.default.schema.json');
  const existing = (await fs.pathExists(pathToFile)) ? await fs.readJson(pathToFile) : {};
  const merged = deepMerge(existing, fragment);
  await fs.writeJson(pathToFile, merged, { spaces: 2 });
}

export async function mergeSettingsSchema(incomingBlocks) {
  const schemaPath = path.join(process.cwd(), 'config/settings_schema.json');
  let existingSchema = [];

  if (await fs.pathExists(schemaPath)) {
    existingSchema = await fs.readJson(schemaPath);
  }

  // Convert array of blocks into keyed objects for merging
  const existingByName = indexByName(existingSchema);
  const incomingByName = indexByName(incomingBlocks);

  // Deep merge each block by name
  for (const name of Object.keys(incomingByName)) {
    if (existingByName[name]) {
      deepMerge(existingByName[name], incomingByName[name]);
    } else {
      existingByName[name] = incomingByName[name];
    }
  }

  // Convert back to array
  const mergedSchema = Object.values(existingByName);
  await fs.writeJson(schemaPath, mergedSchema, { spaces: 2 });
  log.success(`Settings schema updated at ${schemaPath}`);
}