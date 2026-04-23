#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';
import { convertToPdf } from '../src/pdf.js';
import { convertToConfluence } from '../src/confluence.js';
import { loadConfig } from '../src/config.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('markdown-report')
  .description('Convert Markdown files to PDF or Confluence/Jira wiki format')
  .version(version)
  .option('--config <file>', 'path to a JSON configuration file (default: config.json in the current directory)')
  .option('--fonts', 'list available fonts for PDF conversion and exit');

program
  .command('pdf <input>')
  .description('Convert a Markdown file to PDF via pandoc + xelatex + eisvogel')
  .action(async (input) => {
    try {
      const config = resolveConfig(program.opts().config);
      await convertToPdf(input, config);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('confluence <input>')
  .description('Convert a Markdown file to Confluence/Jira wiki format')
  .action(async (input) => {
    try {
      const config = resolveConfig(program.opts().config);
      await convertToConfluence(input, config);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

// Handle --fonts before parse() so it works without a subcommand
if (process.argv.includes('--fonts')) {
  const result = spawnSync('fc-list', [':', 'family'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    console.error('Error: fc-list is not available. Install fontconfig to list fonts.');
    process.exit(1);
  }
  const fonts = result.stdout
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((f) => f.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  console.log(fonts.join('\n'));
  process.exit(0);
}

program.parse();

/**
 * Return a loaded config object. Uses the explicitly provided path if given,
 * falls back to config.json in the current working directory, or {} if neither exists.
 */
function resolveConfig(configPath) {
  if (configPath) return loadConfig(configPath);
  const defaultConfig = resolve(process.cwd(), 'config.json');
  if (existsSync(defaultConfig)) return loadConfig(defaultConfig);
  return {};
}
