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
 * @param {object} [config]  - Optional configuration (as returned by loadConfig).
 * @returns {Promise<void>}
 */
export async function convertToPdf(inputPath, config = {}) {
  const absPath = resolve(inputPath);
  validate(absPath);

  const pdfConfig = config.pdf ?? {};
  const mermaidConfig = config.mermaid ?? {};

  const defaultLuaFilter = resolve(__dirname, '../lua/pdf-filter.lua');
  const luaFilters = resolveFilters(pdfConfig.luaFilter, defaultLuaFilter);
  for (const f of luaFilters) assertFilter(f);

  const stem = basename(absPath, extname(absPath));
  const outputPath = resolve(dirname(absPath), `${stem}.pdf`);

  console.log(`Converting "${stem}" to PDF...`);

  // Pre-process Mermaid diagrams: replace fences with PNG image references.
  const rawContent = readFileSync(absPath, 'utf8');
  const { content, imageDir } = preprocessMermaid(rawContent, mermaidConfig);

  // If there were mermaid blocks, write the processed markdown to a temp file
  // so pandoc can resolve the absolute image paths correctly.
  let pandocInput = absPath;
  let tempDir = null;
  if (imageDir !== null) {
    tempDir = mkdtempSync(join(tmpdir(), 'mdreport-'));
    pandocInput = join(tempDir, `${stem}.md`);
    writeFileSync(pandocInput, content, 'utf8');
  }

  const template = pdfConfig.template ?? 'eisvogel';
  const pdfEngine = pdfConfig.pdfEngine ?? 'xelatex';

  const args = [
    '-o', outputPath,
    '-f', 'markdown+raw_tex',
    '-t', 'pdf',
    `--pdf-engine=${pdfEngine}`,
    '--template', template,
  ];

  for (const f of luaFilters) args.push(`--lua-filter=${f}`);

  args.push('-V', 'header-includes=\\usepackage{adjustbox}');
  args.push('-V', 'header-includes=\\usepackage{float}');

  if (pdfConfig.font) args.push('-V', `mainfont=${pdfConfig.font}`);
  if (pdfConfig.fontSize) args.push('-V', `fontsize=${pdfConfig.fontSize}`);

  for (const [key, value] of Object.entries(pdfConfig.variables ?? {})) {
    if (value !== false) args.push('-V', value === true ? key : `${key}=${value}`);
  }

  if (pdfConfig.tableOfContents !== false) args.push('--toc');
  if (Array.isArray(pdfConfig.extraArgs)) args.push(...pdfConfig.extraArgs);

  try {
    await runPandoc(pandocInput, args);
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    cleanupMermaid(imageDir);
  }

  console.log(`Conversion complete. Output file: ${stem}.pdf`);
}

/** Return [defaultFilter] when luaFilter is unset, otherwise normalise to an array. */
function resolveFilters(luaFilter, defaultFilter) {
  if (luaFilter == null) return [defaultFilter];
  if (Array.isArray(luaFilter)) return luaFilter;
  return [luaFilter];
}
