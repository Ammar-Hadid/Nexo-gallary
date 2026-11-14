import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('shell loads its tokens and retains the base layout and mobile rules', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
  assert.ok(html.includes('tokens.css') && html.indexOf('tokens.css') < html.indexOf('styles.css'));
  assert.match(tokens, /--color-primary:\s*#EF3E4A/i);
  for (const selector of [/\.layout\s*\{/, /\.sidebar\s*\{/, /\.media-grid\s*\{/, /\.viewer\s*\{/]) {
    assert.match(css, selector);
  }
  assert.match(css, /@media\s*\(max-width:\s*740px\)/);
});
