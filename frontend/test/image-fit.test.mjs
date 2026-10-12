import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coverRect } from '../src/lib/image-fit.js';

test('a landscape photo is scaled to fill a square avatar and cropped left and right', () => {
  const rect = coverRect(2000, 1000, 512, 512);
  assert.equal(rect.height, 512);
  assert.equal(rect.width, 1024);
  assert.equal(rect.x, -256);
  assert.equal(rect.y, 0);
});

test('a portrait photo is cropped top and bottom for a wide cover', () => {
  const rect = coverRect(1000, 2000, 1200, 400);
  assert.equal(rect.width, 1200);
  assert.equal(rect.height, 2400);
  assert.equal(rect.x, 0);
  assert.equal(rect.y, -1000);
});

test('the scaled photo always covers the whole target', () => {
  for (const [w, h] of [[300, 300], [4032, 3024], [640, 4000], [1200, 400]]) {
    for (const [tw, th] of [[512, 512], [1200, 400]]) {
      const rect = coverRect(w, h, tw, th);
      assert.ok(rect.x <= 1e-9 && rect.y <= 1e-9);
      assert.ok(rect.x + rect.width >= tw - 1e-9 && rect.y + rect.height >= th - 1e-9);
    }
  }
});
