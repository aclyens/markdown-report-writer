import { resolve, dirname, basename, extname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { validate, assertFilter, runPandoc } from './utils.js';
import { preprocessMermaid, cleanupMermaid } from './mermaid.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Convert a Markdown file to PDF via pandoc + xelatex + eisvogel.
 * Mermaid code fences are pre-rendered to PNG images before pandoc runs.
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

  // Pre-process Mermaid diagrams: replace fences with PNG image references.
  const rawContent = readFileSync(absPath, 'utf8');
  const { content, imageDir } = preprocessMermaid(rawContent);

  // If there were mermaid blocks, write the processed markdown to a temp file
  // so pandoc can resolve the absolute image paths correctly.
  let pandocInput = absPath;
  let tempDir = null;
  if (imageDir !== null) {
    tempDir = mkdtempSync(join(tmpdir(), 'mdreport-'));
    pandocInput = join(tempDir, `${stem}.md`);
    writeFileSync(pandocInput, content, 'utf8');
  }

  try {
    await runPandoc(pandocInput, [
      '-o', outputPath,
      '-f', 'markdown+raw_tex',
      '-t', 'pdf',
      '--pdf-engine=xelatex',
      '--template', 'eisvogel',
      `--lua-filter=${luaFilter}`,
      '-V', 'header-includes=\\usepackage{adjustbox}',
      '-V', 'header-includes=\\usepackage{float}',
      '--toc',
    ]);
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    cleanupMermaid(imageDir);
  }

  console.log(`Conversion complete. Output file: ${stem}.pdf`);
}
