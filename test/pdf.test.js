import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { convertToPdf } from '../src/pdf.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(__dirname, 'fixtures/sample.md');
const output = resolve(__dirname, 'fixtures/sample.pdf');
const mermaidFixture = resolve(__dirname, 'fixtures/sample-mermaid.md');
const mermaidOutput = resolve(__dirname, 'fixtures/sample-mermaid.pdf');

function mmdcAvailable() {
  const local = resolve(__dirname, '../node_modules/.bin/mmdc');
  if (existsSync(local)) return true;
  const result = spawnSync('which', ['mmdc'], { encoding: 'utf8' });
  return result.status === 0 && Boolean(result.stdout.trim());
}

test('convertToPdf produces a .pdf file', async () => {
  if (existsSync(output)) unlinkSync(output);

  await convertToPdf(fixture);

  assert.ok(existsSync(output), 'Output file should exist');

  // PDF files begin with the %PDF- magic bytes
  const header = readFileSync(output, { encoding: 'latin1' }).slice(0, 5);
  assert.equal(header, '%PDF-', 'Output should be a valid PDF file');
});

test('convertToPdf renders mermaid diagrams in a .pdf file', { skip: !mmdcAvailable() }, async () => {
  if (existsSync(mermaidOutput)) unlinkSync(mermaidOutput);

  await convertToPdf(mermaidFixture);

  assert.ok(existsSync(mermaidOutput), 'Mermaid output PDF should exist');

  const header = readFileSync(mermaidOutput, { encoding: 'latin1' }).slice(0, 5);
  assert.equal(header, '%PDF-', 'Mermaid output should be a valid PDF file');
});
