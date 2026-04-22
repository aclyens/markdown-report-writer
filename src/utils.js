import { spawnSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { extname } from 'path';

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
    const child = spawn('pandoc', [src, ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    const stderrChunks = [];
    child.stderr.on('data', (chunk) => stderrChunks.push(chunk));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        reject(new Error(`pandoc exited with code ${code}${stderr ? `: ${stderr}` : ''}`));
      }
    });
    child.on('error', (err) => reject(new Error(`Failed to start pandoc: ${err.message}`)));
  });
}

export function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    throw new Error(`Command "${cmd}" exited with status ${result.status ?? 1}`);
  }
}
