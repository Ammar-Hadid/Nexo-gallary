import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('shell includes its base layout rules as well as responsive overrides', () => {
  const css = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');
  for (const rule of [':root{', '.layout{display:flex', '.sidebar{', '.media-grid{', '.viewer{', '@media(max-width:740px)']) {
    assert.ok(css.includes(rule), `Missing core style rule: ${rule}`);
  }
});
