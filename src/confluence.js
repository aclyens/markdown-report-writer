import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';
import { validate, assertFilter, runPandoc } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Convert a Markdown file to Confluence/Jira wiki format via pandoc.
 * @param {string} inputPath - Absolute or relative path to the .md file.
 * @param {object} [config]  - Optional configuration (as returned by loadConfig).
 * @returns {Promise<void>}
 */
export async function convertToConfluence(inputPath, config = {}) {
  const absPath = resolve(inputPath);
  validate(absPath);

  const confluenceConfig = config.confluence ?? {};

  const defaultLuaFilter = resolve(__dirname, '../lua/confluence-filter.lua');
  const luaFilters = resolveFilters(confluenceConfig.luaFilter, defaultLuaFilter);
  for (const f of luaFilters) assertFilter(f);

  const stem = basename(absPath, extname(absPath));
  const outputPath = resolve(dirname(absPath), `${stem}.txt`);

  console.log(`Converting "${stem}" to Confluence format...`);

  const args = [
    '-o', outputPath,
    '-f', 'markdown+raw_tex',
    '-t', 'jira',
  ];

  for (const f of luaFilters) args.push(`--lua-filter=${f}`);

  if (confluenceConfig.tableOfContents !== false) args.push('--toc');
  if (Array.isArray(confluenceConfig.extraArgs)) args.push(...confluenceConfig.extraArgs);

  await runPandoc(absPath, args);

  // Post-process: strip {anchor:...} macros and add blank lines around headings
  let content = readFileSync(outputPath, 'utf8');
  content = content.replace(/\{anchor:[^}]*\}/g, '');
  content = content.replace(/^(h[1-6]\. .+)$/mg, '\n$1\n');
  writeFileSync(outputPath, content, 'utf8');

  console.log(`Conversion complete. Output file: ${stem}.txt`);
}

/** Return [defaultFilter] when luaFilter is unset, otherwise normalise to an array. */
function resolveFilters(luaFilter, defaultFilter) {
  if (luaFilter == null) return [defaultFilter];
  if (Array.isArray(luaFilter)) return luaFilter;
  return [luaFilter];
}
