import test from 'node:test';
import assert from 'node:assert/strict';
import { findMedia } from './model.js';

test('search combines words and media type without returning unrelated photos', () => {
  assert.deepEqual(findMedia('mountains water', 'video').map(item => item.id), ['m07']);
  assert.deepEqual(findMedia('mountains water', 'photo'), []);
});

test('album filtering narrows results while All Media remains complete', () => {
  assert.equal(findMedia().length, 9);
  assert.deepEqual(findMedia('Kyoto', 'all', 'Japan notes').map(item => item.id), ['m01', 'm04']);
});
