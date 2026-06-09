import assert from 'node:assert/strict';
import test from 'node:test';
import { createSecuritySeed } from '../src/api/platformAdapter.js';

test('createSecuritySeed matches platform 24-character behavior', () => {
  const seed = createSecuritySeed();
  assert.equal(seed.length, 24);
  assert.match(seed, /^[0-9]+$/);
});
