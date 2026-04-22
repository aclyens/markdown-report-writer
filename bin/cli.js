#!/usr/bin/env node

import { Command } from 'commander';
import { createRequire } from 'module';
import { convertToPdf } from '../src/pdf.js';
import { convertToConfluence } from '../src/confluence.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('markdown-report')
  .description('Convert Markdown files to PDF or Confluence/Jira wiki format')
  .version(version);

program
  .command('pdf <input>')
  .description('Convert a Markdown file to PDF via pandoc + xelatex + eisvogel')
  .action(async (input) => {
    try {
      await convertToPdf(input);
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
      await convertToConfluence(input);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
