import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { validate, assertFilter, runPandoc } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Convert a Markdown file to PDF via pandoc + xelatex + eisvogel.
 * @param {string} inputPath - Absolute or relative path to the .md file.
 * @returns {Promise<void>}
 */
export async function convertToPdf(inputPath) {
  const absPath = resolve(inputPath);
  validate(absPath);

  const luaFilter = resolve(__dirname, '../lua/pdf-filter.lua');
  assertFilter(luaFilter);

  const stem = basename(absPath, extname(absPath));
  const outputPath = resolve(dirname(absPath), `${stem}.pdf`);

  console.log(`Converting "${stem}" to PDF...`);
  await runPandoc(absPath, [
    '-o', outputPath,
    '-f', 'markdown+raw_tex',
    '-t', 'pdf',
    '--pdf-engine=xelatex',
    '--template', 'eisvogel',
    `--lua-filter=${luaFilter}`,
    '--toc',
  ]);
  console.log(`Conversion complete. Output file: ${stem}.pdf`);
}
