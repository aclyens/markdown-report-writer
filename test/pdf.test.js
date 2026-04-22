import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { convertToPdf } from '../src/pdf.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(__dirname, 'fixtures/sample.md');
const output = resolve(__dirname, 'fixtures/sample.pdf');

test('convertToPdf produces a .pdf file', async () => {
  if (existsSync(output)) unlinkSync(output);

  await convertToPdf(fixture);

  assert.ok(existsSync(output), 'Output file should exist');

  // PDF files begin with the %PDF- magic bytes
  const { readFileSync } = await import('fs');
  const header = readFileSync(output, { encoding: 'latin1' }).slice(0, 5);
  assert.equal(header, '%PDF-', 'Output should be a valid PDF file');
});
