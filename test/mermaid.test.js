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

test('preprocessMermaid handles a very wide diagram', { skip: !mmdcAvailable() }, () => {
  // LR graph with many nodes produces a wide PNG
  const input = [
    '# Wide',
    '',
    '```mermaid',
    'graph LR',
    '  A[Alpha] --> B[Beta] --> C[Gamma] --> D[Delta] --> E[Epsilon]',
    '  E --> F[Zeta] --> G[Eta] --> H[Theta] --> I[Iota] --> J[Kappa]',
    '  J --> K[Lambda] --> L[Mu] --> M[Nu] --> N[Xi] --> O[Omicron]',
    '```',
    '',
  ].join('\n');

  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.ok(!content.includes('```mermaid'), 'Mermaid fence should be replaced');
    assert.match(content, /!\[Diagram 1\]\(.+diagram-0\.png\)/, 'Should contain wide diagram image reference');
    assert.ok(existsSync(imageDir), 'imageDir should exist');
  } finally {
    cleanupMermaid(imageDir);
  }
});

test('preprocessMermaid handles a very tall diagram', { skip: !mmdcAvailable() }, () => {
  // TD graph with a long vertical chain produces a tall PNG
  const input = [
    '# Tall',
    '',
    '```mermaid',
    'graph TD',
    '  A[Step 1] --> B[Step 2] --> C[Step 3] --> D[Step 4] --> E[Step 5]',
    '  E --> F[Step 6] --> G[Step 7] --> H[Step 8] --> I[Step 9] --> J[Step 10]',
    '  J --> K[Step 11] --> L[Step 12] --> M[Step 13] --> N[Step 14] --> O[Step 15]',
    '  O --> P[Step 16] --> Q[Step 17] --> R[Step 18] --> S[Step 19] --> T[Step 20]',
    '```',
    '',
  ].join('\n');

  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.ok(!content.includes('```mermaid'), 'Mermaid fence should be replaced');
    assert.match(content, /!\[Diagram 1\]\(.+diagram-0\.png\)/, 'Should contain tall diagram image reference');
    assert.ok(existsSync(imageDir), 'imageDir should exist');
  } finally {
    cleanupMermaid(imageDir);
  }
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

test('preprocessMermaid uses caption from info string', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid caption="System overview"\ngraph TD\nA --> B\n```\n\nEnd.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.ok(!content.includes('```mermaid'), 'Mermaid fence should be replaced');
    assert.match(content, /!\[System overview\]\(.+diagram-0\.png\)/, 'Should use caption from info string');
  } finally {
    cleanupMermaid(imageDir);
  }
});

test('preprocessMermaid uses caption with spaces from info string', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid caption="My Flow Diagram"\ngraph TD\nA --> B\n```\n\nEnd.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.match(content, /!\[My Flow Diagram\]\(/, 'Should preserve caption with spaces');
  } finally {
    cleanupMermaid(imageDir);
  }
});

test('preprocessMermaid falls back to "Diagram N" when no caption in info string', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid scale=2\ngraph TD\nA --> B\n```\n\nEnd.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.match(content, /!\[Diagram 1\]\(/, 'Should fall back to default alt text');
  } finally {
    cleanupMermaid(imageDir);
  }
});

test('preprocessMermaid adds pandoc width attribute from info string', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid width=80%\ngraph TD\nA --> B\n```\n\nEnd.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.match(content, /!\[Diagram 1\]\(.+diagram-0\.png\)\{width=80%\}/, 'Should include width attribute');
  } finally {
    cleanupMermaid(imageDir);
  }
});

test('preprocessMermaid adds pandoc height attribute from info string', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid height=50%\ngraph TD\nA --> B\n```\n\nEnd.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.match(content, /!\[Diagram 1\]\(.+diagram-0\.png\)\{height=50%\}/, 'Should include height attribute');
  } finally {
    cleanupMermaid(imageDir);
  }
});

test('preprocessMermaid adds both width and height attributes from info string', { skip: !mmdcAvailable() }, () => {
  const input = '# Doc\n\n```mermaid width=80% height=50%\ngraph TD\nA --> B\n```\n\nEnd.\n';
  const { content, imageDir } = preprocessMermaid(input);
  try {
    assert.match(content, /!\[Diagram 1\]\(.+diagram-0\.png\)\{width=80% height=50%\}/, 'Should include both attributes');
  } finally {
    cleanupMermaid(imageDir);
  }
});
