import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { convertToConfluence } from '../src/confluence.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(__dirname, 'fixtures/sample.md');
const output = resolve(__dirname, 'fixtures/sample.txt');

test('convertToConfluence produces a .txt file', async () => {
  if (existsSync(output)) unlinkSync(output);

  await convertToConfluence(fixture);

  assert.ok(existsSync(output), 'Output file should exist');

  const content = readFileSync(output, 'utf8');
  assert.ok(content.includes('h1.'), 'Output should contain a Jira h1 heading');
  assert.ok(content.includes('h2.'), 'Output should contain a Jira h2 heading');
  assert.ok(!content.includes('{anchor:'), 'Output should not contain {anchor:...} macros');
});
