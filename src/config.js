import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';

const DEFAULTS = {
  pdf: {
    template: 'eisvogel',
    pdfEngine: 'xelatex',
    font: '',
    fontSize: '',
    tableOfContents: true,
    luaFilter: null,   // null → use built-in lua/pdf-filter.lua
    variables: {},
    extraArgs: [],
  },
  confluence: {
    tableOfContents: true,
    luaFilter: null,   // null → use built-in lua/confluence-filter.lua
    extraArgs: [],
  },
  mermaid: {
    theme: '',
    scale: null,
    width: null,
    height: null,
    backgroundColor: '',
    puppeteerConfig: '',
  },
};

/**
 * Load and validate a JSON configuration file, merging it with defaults.
 * All file paths inside the config are resolved relative to the config file's directory.
 *
 * @param {string} configPath - Path to the JSON config file.
 * @returns {object} Merged configuration object.
 */
export function loadConfig(configPath) {
  const absPath = resolve(configPath);
  if (!existsSync(absPath)) {
    throw new Error(`Config file "${configPath}" not found.`);
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse config file "${configPath}": ${err.message}`);
  }

  const baseDir = dirname(absPath);

  const config = {
    pdf: {
      ...DEFAULTS.pdf,
      ...(raw.pdf ?? {}),
      variables: { ...(raw.pdf?.variables ?? {}) },
      extraArgs: [...(raw.pdf?.extraArgs ?? [])],
    },
    confluence: {
      ...DEFAULTS.confluence,
      ...(raw.confluence ?? {}),
      extraArgs: [...(raw.confluence?.extraArgs ?? [])],
    },
    mermaid: {
      ...DEFAULTS.mermaid,
      ...(raw.mermaid ?? {}),
    },
  };

  // Resolve lua filter path(s) relative to the config file's directory
  if (config.pdf.luaFilter != null) {
    config.pdf.luaFilter = resolvePaths(config.pdf.luaFilter, baseDir);
  }
  if (config.confluence.luaFilter != null) {
    config.confluence.luaFilter = resolvePaths(config.confluence.luaFilter, baseDir);
  }

  // Resolve mermaid.puppeteerConfig relative to the config file's directory
  if (config.mermaid.puppeteerConfig) {
    config.mermaid.puppeteerConfig = resolve(baseDir, config.mermaid.puppeteerConfig);
  }

  return config;
}

/** Resolve a single path string or an array of path strings against baseDir. */
function resolvePaths(filter, baseDir) {
  if (Array.isArray(filter)) {
    return filter.map((p) => resolve(baseDir, p));
  }
  return resolve(baseDir, filter);
}
