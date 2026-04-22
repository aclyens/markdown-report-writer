import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { extname } from 'path';
import nodePandoc from 'node-pandoc';

export function validate(inputPath) {
  if (!existsSync(inputPath)) {
    throw new Error(`File "${inputPath}" not found.`);
  }
  if (extname(inputPath) !== '.md') {
    throw new Error(`File "${inputPath}" is not a Markdown file.`);
  }
}

export function assertFilter(filterPath) {
  if (!existsSync(filterPath)) {
    throw new Error(`Lua filter "${filterPath}" not found.`);
  }
}

export function runPandoc(src, args) {
  return new Promise((resolve, reject) => {
    nodePandoc(src, args, (err) => {
      if (err) reject(new Error(`pandoc failed: ${err}`));
      else resolve();
    });
  });
}

export function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    throw new Error(`Command "${cmd}" exited with status ${result.status ?? 1}`);
  }
}
