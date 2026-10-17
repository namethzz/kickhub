const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
process.env.SECRET_KEY = 'isolated-auth-limit-test-secret';
const app = require('../app');
async function withServer(work) {
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try { await work(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise(resolve => server.close(resolve)); }
}
test('removed reservation, legacy party and duplicate auth routes are no longer served', async context => {
  context.mock.method(User, 'findById', () => ({ select: async () => ({ _id: '507f1f77bcf86cd799439011', role: 'user', status: 'active' }) }));
  const token = jwt.sign({ _id: '507f1f77bcf86cd799439011' }, process.env.SECRET_KEY);
  await withServer(async url => {
    const routes = [['GET', '/api/reservations'], ['GET', '/api/reservations/507f1f77bcf86cd799439011'], ['GET', '/api/field-reservations/507f1f77bcf86cd799439011'], ['GET', '/api/user-reservations'],
      ['POST', '/api/new-reservation/507f1f77bcf86cd799439011'], ['PUT', '/api/update-reservation/507f1f77bcf86cd799439011'], ['GET', '/api/test'], ['GET', '/api/user'], ['GET', '/api/fields'],
      ['GET', '/api/fields/507f1f77bcf86cd799439011'], ['PUT', '/api/join-party/507f1f77bcf86cd799439011'], ['GET', '/api/post/507f1f77bcf86cd799439011'], ['POST', '/login'], ['POST', '/register']];
    for (const [method, path] of routes) {
      const response = await fetch(url + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(method === 'GET' ? {} : { body: '{}' }) });
      assert.equal(response.status, 404, `${method} ${path}`);
    }
  });
});
test('repeated failed logins from one IP are throttled with a JSON message', async context => {
  context.mock.method(User, 'findOne', async () => null);
  await withServer(async url => {
    const login = () => fetch(`${url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'guess@example.test', password: 'wrong-password' }) });
    for (let attempt = 0; attempt < 20; attempt++) assert.equal((await login()).status, 401);
    const blocked = await login();
    assert.equal(blocked.status, 429);
    assert.match((await blocked.json()).message, /15 นาที/);
    assert.ok(blocked.headers.get('ratelimit'));
  });
});
test('provider config reads are never throttled, account-creating posts are', async () => {
  await withServer(async url => {
    for (let attempt = 0; attempt < 40; attempt++) assert.equal((await fetch(`${url}/api/auth/google/config`)).status, 200);
    const complete = () => fetch(`${url}/api/auth/social/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    for (let attempt = 0; attempt < 30; attempt++) assert.equal((await complete()).status, 400);
    assert.equal((await complete()).status, 429);
  });
});
