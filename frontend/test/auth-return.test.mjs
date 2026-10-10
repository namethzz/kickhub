import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeReturnPath } from '../src/features/live/auth-return.js';
test('login preserves internal party, field and creation destinations', () => {
  for (const value of ['/parties/abc', '/fields/abc', '/create-party?field=abc', '/team?field=abc']) assert.equal(safeReturnPath(value), value);
});
test('login rejects external destinations, backslashes and auth loops', () => {
  for (const value of [null, '', 'https://example.com', '//example.com', '/\\example.com', '/login', '/signup?next=/login', '/team\n']) assert.equal(safeReturnPath(value, '/profile'), '/profile');
});
