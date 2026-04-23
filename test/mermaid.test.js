import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { preprocessMermaid, cleanupMermaid } from '../src/mermaid.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function mmdcAvailable() {
  const local = resolve(__dirname, '../node_modules/.bin/mmdc');
  if (existsSync(local)) return true;
  const result = spawnSync('which', ['mmdc'], { encoding: 'utf8' });
  return result.status === 0 && Boolean(result.stdout.trim());
}

test('preprocessMermaid returns unchanged content when no mermaid blocks present', () => {
  const input = '# Hello\n\nNo diagrams here.\n';
  const { content, imageDir } = preprocessMermaid(input);
  assert.equal(content, input);
  assert.equal(imageDir, null);
});

test('preprocessMermaid converts mermaid fences to PNG image references', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid\ngraph TD\nA --> B\n```\n\nSome text.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.ok(!content.includes('```mermaid'), 'Mermaid fence should be replaced');
    assert.match(content, /!\[Diagram 1\]\(.+diagram-0\.png\)/, 'Should contain image reference');
    assert.ok(imageDir !== null, 'imageDir should be set');
    assert.ok(existsSync(imageDir), 'imageDir should exist on disk');
  } finally {
    cleanupMermaid(imageDir);
  }
  assert.ok(!existsSync(imageDir), 'imageDir should be cleaned up');
});

test('preprocessMermaid handles multiple mermaid blocks', { skip: !mmdcAvailable() }, () => {
  const input = [
    '# Multi',
    '',
    '```mermaid',
    'graph TD',
    'A --> B',
    '```',
    '',
    'Middle text.',
    '',
    '```mermaid',
    'sequenceDiagram',
    'Alice->>Bob: Hello',
    '```',
    '',
    'End.',
    '',
  ].join('\n');

  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.ok(content.includes('![Diagram 1]'), 'Should reference first diagram');
    assert.ok(content.includes('![Diagram 2]'), 'Should reference second diagram');
    assert.ok(!content.includes('```mermaid'), 'No mermaid fences should remain');
  } finally {
    cleanupMermaid(imageDir);
  }
});
