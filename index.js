#!/usr/bin/env node

'use strict';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: markdown-report [options] <input>

Options:
  -h, --help     Show this help message
  -v, --version  Show version number
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  const { version } = require('./package.json');
  console.log(version);
  process.exit(0);
}
