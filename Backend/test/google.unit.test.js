const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { configuration, verifyGoogleToken, googleAccount } = require('../services/googleAuth');
const original = process.env.GOOGLE_CLIENT_ID;
const clientId = '123-kickhub.apps.googleusercontent.com';
before(() => { process.env.GOOGLE_CLIENT_ID = clientId; });
after(() => { if (original === undefined) delete process.env.GOOGLE_CLIENT_ID; else process.env.GOOGLE_CLIENT_ID = original; });
const profile = overrides => ({ sub: 'google-player', name: 'Footballer', email: 'PLAYER@gmail.com', email_verified: true, aud: clientId, iss: 'https://accounts.google.com', exp: Math.floor(Date.now() / 1000) + 3600, ...overrides });
test('Google auth library verifies cryptographic signature, audience, issuer and expiry', async context => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const verifier = new OAuth2Client();
  context.mock.method(verifier, 'getFederatedSignonCertsAsync', async () => ({ certs: { test: publicKey.export({ type: 'spki', format: 'pem' }) }, format: 'PEM' }));
  const sign = payload => jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: 'test' });
  assert.equal((await verifyGoogleToken(sign(profile()), verifier)).sub, 'google-player');
  for (const overrides of [{ aud: 'other-app' }, { iss: 'https://attacker.test' }, { exp: 1 }, { email_verified: false }, { sub: '' }]) {
    await assert.rejects(() => verifyGoogleToken(sign(profile(overrides)), verifier), error => error.status === 401);
  }
  const other = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  await assert.rejects(() => verifyGoogleToken(jwt.sign(profile(), other.privateKey, { algorithm: 'RS256', keyid: 'test' }), verifier), error => error.status === 401);
});
test('Google invalid input and missing configuration fail before verification', async () => {
  await assert.rejects(() => verifyGoogleToken(''), error => error.status === 400);
  await assert.rejects(() => verifyGoogleToken('a'.repeat(16385)), error => error.status === 400);
  delete process.env.GOOGLE_CLIENT_ID;
  try { assert.equal(configuration().enabled, false); await assert.rejects(() => verifyGoogleToken('token'), error => error.status === 503); }
  finally { process.env.GOOGLE_CLIENT_ID = clientId; }
});
test('returning Google users retain role and inactive users are rejected', async context => {
  const user = { status: 'active', role: 'user' };
  context.mock.method(User, 'findOne', async query => { assert.equal(query.google_id, 'google-player'); return user; });
  assert.equal(await googleAccount(profile(), 'owner'), user); assert.equal(user.role, 'user');
  user.status = 'banned'; await assert.rejects(() => googleAccount(profile()), error => error.status === 403);
  await assert.rejects(() => googleAccount(profile(), 'admin'), error => error.status === 400);
});
test('email collision never links Google to password or Facebook accounts', async context => {
  context.mock.method(User, 'findOne', async () => null);
  context.mock.method(User, 'exists', async () => ({ _id: 'other-account' }));
  const create = context.mock.method(User, 'create', async () => { throw new Error('Unexpected creation'); });
  await assert.rejects(() => googleAccount(profile()), error => error.status === 409);
  assert.equal(create.mock.callCount(), 0);
});
test('new Google accounts use verified subject, normalized email, role and hashed random password', async context => {
  context.mock.method(User, 'findOne', async () => null); context.mock.method(User, 'exists', async () => null); context.mock.method(User, 'create', async data => data);
  const user = await googleAccount(profile(), 'owner');
  assert.equal(user.google_id, 'google-player'); assert.equal(user.email, 'player@gmail.com'); assert.equal(user.role, 'owner'); assert.equal(user.name, 'Footballer'); assert.match(user.password, /^\$2[aby]\$/);
});
test('Google HTTP login verifies credential then issues KickHub JWT with requested lifetime', async context => {
  const app = require('../app'); const oldSecret = process.env.SECRET_KEY;
  process.env.SECRET_KEY = 'isolated-google-route-test-secret';
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  context.mock.method(OAuth2Client.prototype, 'verifyIdToken', async options => { assert.equal(options.audience, clientId); if (options.idToken !== 'valid-token') throw new Error('Invalid'); return { getPayload: () => profile() }; });
  const lookup = context.mock.method(User, 'findOne', async () => ({ _id: '507f1f77bcf86cd799439011', status: 'active', role: 'user' }));
  try {
    assert.deepEqual(await (await fetch(`${url}/api/auth/google/config`)).json(), { enabled: true, clientId });
    const request = body => fetch(`${url}/api/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await request({ credential: 'invalid' })).status, 401); assert.equal(lookup.mock.callCount(), 0);
    for (const rememberMe of [false, true]) {
      const response = await request({ credential: 'valid-token', role: 'owner', rememberMe }); assert.equal(response.status, 200);
      const body = await response.json(); assert.deepEqual(Object.keys(body).sort(), ['role', 'status', 'token']);
      const claims = jwt.verify(body.token, process.env.SECRET_KEY); assert.equal(claims._id, '507f1f77bcf86cd799439011'); assert.equal(claims.exp - claims.iat, rememberMe ? 604800 : 86400);
    }
  } finally { await new Promise(resolve => server.close(resolve)); if (oldSecret === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = oldSecret; }
});
