import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync } from 'fs';
import { validate, assertFilter, runPandoc } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Convert a Markdown file to Confluence/Jira wiki format via pandoc.
 * @param {string} inputPath - Absolute or relative path to the .md file.
 * @returns {Promise<void>}
 */
export async function convertToConfluence(inputPath) {
  const absPath = resolve(inputPath);
  validate(absPath);

  const luaFilter = resolve(__dirname, '../lua/confluence-filter.lua');
  assertFilter(luaFilter);

  const stem = basename(absPath, extname(absPath));
  const outputPath = resolve(dirname(absPath), `${stem}.txt`);

  console.log(`Converting "${stem}" to Confluence format...`);
  await runPandoc(absPath, [
    '-o', outputPath,
    '-f', 'markdown+raw_tex',
    '-t', 'jira',
    `--lua-filter=${luaFilter}`,
    '--toc',
  ]);

  // Post-process: strip {anchor:...} macros and add blank lines around headings
  let content = readFileSync(outputPath, 'utf8');
  content = content.replace(/\{anchor:[^}]*\}/g, '');
  content = content.replace(/^(h[1-6]\. .+)$/mg, '\n$1\n');
  writeFileSync(outputPath, content, 'utf8');

  console.log(`Conversion complete. Output file: ${stem}.txt`);
}
