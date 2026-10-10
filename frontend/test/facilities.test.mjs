import { test } from 'node:test';
import assert from 'node:assert/strict';
import { facilityLabels } from '../src/features/fields/facilities.js';
test('current labels and legacy aliases are trimmed and deduplicated', () => {
  assert.deepEqual(facilityLabels(['ห้องน้ำ', ' parking ', 'ที่จอดรถ', 'wifi free']), ['ห้องน้ำ', 'ที่จอดรถ', 'Wi-Fi ฟรี']);
});
test('legacy JSON strings decode without displaying character indexes', () => {
  const raw = JSON.stringify({ lights: true, parking: true, restroom: false, shop: 'false' });
  assert.deepEqual(facilityLabels(raw), ['ไฟส่องสว่าง', 'ที่จอดรถ']);
  assert.deepEqual(facilityLabels({ ...raw }), ['ไฟส่องสว่าง', 'ที่จอดรถ']);
  assert.deepEqual(facilityLabels(JSON.stringify(['ห้องน้ำ', 'ร้านค้า'])), ['ห้องน้ำ', 'ร้านค้า']);
});
test('indexed arrays use values while numeric flags never become facility names', () => {
  assert.deepEqual(facilityLabels({ 0: 'ห้องน้ำ', 1: 'ที่จอดรถ' }), ['ห้องน้ำ', 'ที่จอดรถ']);
  assert.deepEqual(facilityLabels({ 0: true, 1: false, 2: 'false' }), []);
  assert.deepEqual(facilityLabels({ parking: 'false', restroom: false, lights: 'true' }), ['ไฟส่องสว่าง']);
});
test('missing and malformed data is safe and comma-separated legacy text is supported', () => {
  for (const input of [null, undefined, 42, {}, '[broken', '{bad', ['0', '', null, {}]]) assert.deepEqual(facilityLabels(input), []);
  assert.deepEqual(facilityLabels('ห้องน้ำ, ที่จอดรถ'), ['ห้องน้ำ', 'ที่จอดรถ']);
});
