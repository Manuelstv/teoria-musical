import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOXES, nextBox, accuracy } from './review.js';

test('BOXES has 3 levels with exact names (D-01)', () => {
  assert.equal(BOXES.length, 3);
  assert.deepEqual(BOXES, ['box-1-ainda-nao-sei', 'box-2-quase-la', 'box-3-ja-sei']);
});

test('nextBox forward advances one level', () => {
  assert.equal(nextBox(0, 'forward'), 1);
});

test('nextBox forward clamps at the top', () => {
  assert.equal(nextBox(2, 'forward'), 2);
});

test('nextBox back moves one level back', () => {
  assert.equal(nextBox(1, 'back'), 0);
});

test('nextBox back clamps at the bottom', () => {
  assert.equal(nextBox(0, 'back'), 0);
});

test('accuracy(3,4) === 0.75', () => {
  assert.equal(accuracy(3, 4), 0.75);
});

test('accuracy(0,0) === 0 (no division by zero)', () => {
  assert.equal(accuracy(0, 0), 0);
});
