const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { configuration, verifyFacebookToken, facebookAccount } = require('../services/facebookAuth');
const original = Object.fromEntries(['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_GRAPH_VERSION'].map(key => [key, process.env[key]]));
before(() => { process.env.FACEBOOK_APP_ID = '123'; process.env.FACEBOOK_APP_SECRET = 'fake-test-app-secret'; process.env.FACEBOOK_GRAPH_VERSION = 'v25.0'; });
after(() => { for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
const debug = overrides => ({ data: { is_valid: true, type: 'USER', app_id: '123', user_id: '456', expires_at: Math.floor(Date.now() / 1000) + 3600, ...overrides } });
const fakeFetch = (first, second = { id: '456', name: 'Player', email: 'player@example.test' }) => async url => ({ ok: true, json: async () => url.includes('debug_token') ? first : second });
test('server validates Facebook app and user identity before trusting profile', async () => {
  const calls = [];
  const fetcher = fakeFetch(debug());
  const profile = await verifyFacebookToken('test-user-token', async (url, options) => { calls.push({ url, options }); return fetcher(url); });
  assert.equal(profile.id, '456'); assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer 123|fake-test-app-secret');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-user-token');
  assert.match(calls[1].url, /appsecret_proof=[a-f0-9]{64}/);
});
test('wrong app, expired token, non-user token and mismatched profile are rejected', async () => {
  for (const overrides of [{ app_id: '999' }, { is_valid: false }, { expires_at: 1 }, { data_access_expires_at: 1 }, { type: 'PAGE' }, { user_id: '' }]) {
    await assert.rejects(() => verifyFacebookToken('token', fakeFetch(debug(overrides))), error => error.status === 401);
  }
  await assert.rejects(() => verifyFacebookToken('token', fakeFetch(debug(), { id: '999', name: 'Other' })), error => error.status === 401);
  await assert.rejects(() => verifyFacebookToken('', fakeFetch(debug())), error => error.status === 400);
});
test('Facebook outage and disabled configuration produce usable errors', async () => {
  await assert.rejects(() => verifyFacebookToken('token', async () => { throw new Error('offline'); }), error => error.status === 502);
  const secret = process.env.FACEBOOK_APP_SECRET; delete process.env.FACEBOOK_APP_SECRET;
  try { assert.equal(configuration().enabled, false); await assert.rejects(() => verifyFacebookToken('token', fakeFetch(debug())), error => error.status === 503); }
  finally { process.env.FACEBOOK_APP_SECRET = secret; }
});
test('existing Facebook accounts retain role and banned accounts cannot sign in', async context => {
  const user = { role: 'user', status: 'active' };
  context.mock.method(User, 'findOne', async () => user);
  assert.equal(await facebookAccount({ id: '456' }, 'owner'), user); assert.equal(user.role, 'user');
  user.status = 'banned'; await assert.rejects(() => facebookAccount({ id: '456' }), error => error.status === 403);
});
test('email collisions and missing email never attach Facebook identity to another account', async context => {
  context.mock.method(User, 'findOne', async () => null);
  context.mock.method(User, 'exists', async () => ({ _id: 'password-account' }));
  const create = context.mock.method(User, 'create', async () => { throw new Error('Must not create'); });
  await assert.rejects(() => facebookAccount({ id: '456', email: 'existing@example.test' }), error => error.status === 409);
  await assert.rejects(() => facebookAccount({ id: '456' }), error => error.status === 400);
  assert.equal(create.mock.callCount(), 0);
});
test('new Facebook users get server profile, chosen role and a hashed random password', async context => {
  context.mock.method(User, 'findOne', async () => null); context.mock.method(User, 'exists', async () => null); context.mock.method(User, 'create', async data => data);
  const user = await facebookAccount({ id: '456', name: 'Footballer', email: 'PLAYER@example.test' }, 'owner');
  assert.equal(user.facebook_id, '456'); assert.equal(user.email, 'player@example.test'); assert.equal(user.role, 'owner'); assert.match(user.password, /^\$2[aby]\$/);
});
test('HTTP Facebook config hides secrets and successful login issues only a KickHub token', async context => {
  const jwt = require('jsonwebtoken');
  const app = require('../app');
  const oldSecret = process.env.SECRET_KEY;
  process.env.SECRET_KEY = 'isolated-facebook-route-test-secret';
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const actualFetch = global.fetch;
  const user = { _id: '507f1f77bcf86cd799439011', status: 'active', role: 'user' };
  context.mock.method(User, 'findOne', async () => user);
  context.mock.method(global, 'fetch', async (url, options) => String(url).startsWith('https://graph.facebook.com/') ? fakeFetch(debug())(url, options) : actualFetch(url, options));
  try {
    const config = await (await fetch(`${url}/api/auth/facebook/config`)).json();
    assert.deepEqual(config, { enabled: true, appId: '123', version: 'v25.0' });
    for (const rememberMe of [false, true]) {
      const response = await fetch(`${url}/api/auth/facebook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: 'test-token', role: 'owner', rememberMe }) });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.deepEqual(Object.keys(body).sort(), ['role', 'status', 'token']);
      const claims = jwt.verify(body.token, process.env.SECRET_KEY);
      assert.equal(claims._id, user._id); assert.equal(claims.exp - claims.iat, rememberMe ? 604800 : 86400);
      assert.equal(user.role, 'user');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    if (oldSecret === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = oldSecret;
  }
});
