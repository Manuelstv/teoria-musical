import { test } from 'node:test';
import assert from 'node:assert/strict';
import { midiToFreq, degreeToMidi, DIFFICULTY_TIERS } from './ear-trainer.js';

test('midiToFreq(69) === 440', () => {
  assert.equal(midiToFreq(69), 440);
});

test('midiToFreq(81) approx 880', () => {
  assert.ok(Math.abs(midiToFreq(81) - 880) < 1e-6);
});

test('degreeToMidi(60, 7) === 67', () => {
  assert.equal(degreeToMidi(60, 7), 67);
});

test('DIFFICULTY_TIERS is an array with progressive tiers', () => {
  assert.ok(Array.isArray(DIFFICULTY_TIERS));
  assert.ok(DIFFICULTY_TIERS.length > 0);

  const tier0 = DIFFICULTY_TIERS[0];
  assert.ok(Array.isArray(tier0));
  assert.ok(tier0.length <= 3, 'tier 0 deve ter poucos intervalos (<=3)');

  for (let i = 1; i < DIFFICULTY_TIERS.length; i++) {
    const prev = DIFFICULTY_TIERS[i - 1];
    const curr = DIFFICULTY_TIERS[i];
    const isSuperset = prev.every((semitone) => curr.includes(semitone));
    assert.ok(isSuperset, `tier ${i} deve conter todos os semitons do tier ${i - 1}`);
  }
});
