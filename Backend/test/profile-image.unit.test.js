const { test } = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const ProfileImage = require('../models/ProfileImage');
const images = require('../services/profileImageService');

const query = value => ({ select: async () => value });
const jpeg = (size = 64) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(size)]);
const png = () => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
const webp = () => Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(16)]);
const GOOGLE_URL = 'https://lh3.googleusercontent.com/a/photo=s96-c';
const okResponse = (body = jpeg()) => ({ ok: true, headers: { get: () => String(body.length) }, arrayBuffer: async () => body });

test('sniffType trusts file bytes, not names or declared types', () => {
  assert.equal(images.sniffType(jpeg()), 'image/jpeg');
  assert.equal(images.sniffType(png()), 'image/png');
  assert.equal(images.sniffType(webp()), 'image/webp');
  assert.equal(images.sniffType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), '');
  assert.equal(images.sniffType(Buffer.from('GIF89a------------')), '');
  assert.equal(images.sniffType('not a buffer'), '');
});

test('provider photo URLs are limited to https provider CDNs', () => {
  assert.equal(images.socialPhotoUrl('google', GOOGLE_URL), 'https://lh3.googleusercontent.com/a/photo=s512-c');
  assert.ok(images.socialPhotoUrl('facebook', 'https://scontent-bkk1-1.xx.fbcdn.net/v/t39/photo.jpg?x=1'));
  assert.ok(images.socialPhotoUrl('facebook', 'https://platform-lookaside.fbsbx.com/platform/profilepic/?asid=1'));
  for (const bad of [
    'http://lh3.googleusercontent.com/a/photo', 'https://169.254.169.254/latest/meta-data', 'https://localhost/photo.jpg',
    'https://lh3.googleusercontent.com.evil.test/a', 'https://evil.test/lh3.googleusercontent.com', 'https://user:pw@lh3.googleusercontent.com/a',
    'https://lh3.googleusercontent.com:8443/a', 'javascript:alert(1)', '', null, undefined, 42, 'https://lh3.googleusercontent.com/' + 'a'.repeat(2100),
  ]) assert.equal(images.socialPhotoUrl('google', bad), '', String(bad).slice(0, 60));
  // A Facebook URL is never accepted as a Google photo, or the reverse.
  assert.equal(images.socialPhotoUrl('google', 'https://scontent.xx.fbcdn.net/photo.jpg'), '');
  assert.equal(images.socialPhotoUrl('facebook', GOOGLE_URL), '');
  assert.equal(images.socialPhotoUrl('twitter', GOOGLE_URL), '');
});

test('saveImage rejects empty, oversized and non-image uploads before touching the database', async context => {
  const update = context.mock.method(ProfileImage, 'updateOne', async () => ({}));
  context.mock.method(User, 'findById', () => query({ _id: 'u1' }));
  await assert.rejects(images.saveImage('u1', 'avatar', Buffer.alloc(0)), error => error.status === 400);
  await assert.rejects(images.saveImage('u1', 'avatar', 'text'), error => error.status === 400);
  await assert.rejects(images.saveImage('u1', 'avatar', jpeg(1024 * 1024)), error => error.status === 413);
  await assert.rejects(images.saveImage('u1', 'cover', jpeg(2 * 1024 * 1024)), error => error.status === 413);
  await assert.rejects(images.saveImage('u1', 'avatar', Buffer.from('<svg onload=alert(1)></svg>--------')), error => error.status === 415);
  await assert.rejects(images.saveImage('u1', 'banner', jpeg()), error => error.status === 400);
  assert.equal(update.mock.callCount(), 0);
});

test('saveImage stores the image, versions the URL and records where the avatar came from', async context => {
  const update = context.mock.method(ProfileImage, 'updateOne', async () => ({}));
  context.mock.method(User, 'findById', () => query({ _id: 'u1' }));
  const change = context.mock.method(User, 'findByIdAndUpdate', async (id, patch) => ({ _id: id, ...patch.$set }));
  await images.saveImage('u1', 'avatar', jpeg());
  assert.deepEqual(update.mock.calls[0].arguments[0], { user_id: 'u1', kind: 'avatar' });
  assert.equal(update.mock.calls[0].arguments[1].$set.content_type, 'image/jpeg');
  assert.equal(update.mock.calls[0].arguments[2].upsert, true);
  const avatarSet = change.mock.calls[0].arguments[1].$set;
  assert.equal(avatarSet.avatar_source, 'upload');
  assert.ok(avatarSet.avatar_updated_at instanceof Date);
  await images.saveImage('u1', 'cover', png());
  const coverSet = change.mock.calls[1].arguments[1].$set;
  assert.ok(coverSet.cover_updated_at instanceof Date);
  assert.equal('avatar_source' in coverSet, false);
});

test('removing an avatar records an explicit opt-out so social login does not bring it back', async context => {
  const gone = context.mock.method(ProfileImage, 'deleteOne', async () => ({}));
  const change = context.mock.method(User, 'findByIdAndUpdate', async () => ({}));
  await images.removeImage('u1', 'avatar');
  assert.deepEqual(gone.mock.calls[0].arguments[0], { user_id: 'u1', kind: 'avatar' });
  assert.equal(change.mock.calls[0].arguments[1].$set.avatar_source, 'none');
  assert.ok('avatar_updated_at' in change.mock.calls[0].arguments[1].$unset);
  await images.removeImage('u1', 'cover');
  assert.equal(change.mock.calls[1].arguments[1].$set, undefined);
  assert.ok('cover_updated_at' in change.mock.calls[1].arguments[1].$unset);
});

test('imageUrl is empty without a photo and changes whenever the photo changes', () => {
  assert.equal(images.imageUrl({ _id: 'u1' }, 'avatar'), '');
  const first = images.imageUrl({ _id: 'u1', avatar_updated_at: new Date(1000) }, 'avatar');
  const second = images.imageUrl({ _id: 'u1', avatar_updated_at: new Date(2000) }, 'avatar');
  assert.equal(first, '/api/v2/profiles/u1/avatar?v=1000');
  assert.notEqual(first, second);
  assert.equal(images.imageUrl({ _id: 'u1', cover_updated_at: new Date(5) }, 'cover'), '/api/v2/profiles/u1/cover?v=5');
});

test('importSocialPhoto fetches only the verified stored URL and never follows redirects', async context => {
  context.mock.method(User, 'findById', () => query({ _id: 'u1', social_photos: { google: GOOGLE_URL } }));
  context.mock.method(ProfileImage, 'updateOne', async () => ({}));
  const change = context.mock.method(User, 'findByIdAndUpdate', async () => ({}));
  const fetcher = context.mock.fn(async () => okResponse());
  await images.importSocialPhoto('u1', 'google', fetcher);
  assert.equal(fetcher.mock.calls[0].arguments[0], 'https://lh3.googleusercontent.com/a/photo=s512-c');
  assert.equal(fetcher.mock.calls[0].arguments[1].redirect, 'manual');
  assert.equal(change.mock.calls[0].arguments[1].$set.avatar_source, 'google');
  await assert.rejects(images.importSocialPhoto('u1', 'facebook', fetcher), error => error.status === 404);
  await assert.rejects(images.importSocialPhoto('u1', 'twitter', fetcher), error => error.status === 400);
});

test('remote photo failures become clear errors', async () => {
  await assert.rejects(images.fetchRemoteImage('https://x', 1024, async () => { throw new Error('network'); }), error => error.status === 502);
  await assert.rejects(images.fetchRemoteImage('https://x', 1024, async () => ({ ok: false, status: 302, headers: { get: () => null } })), error => error.status === 502);
  await assert.rejects(images.fetchRemoteImage('https://x', 10, async () => okResponse(jpeg(100))), error => error.status === 413);
  await assert.rejects(images.fetchRemoteImage('https://x', 10, async () => ({ ok: true, headers: { get: () => null }, arrayBuffer: async () => jpeg(100) })), error => error.status === 413);
});

test('a social login remembers the photo and uses it only when the user has no choice recorded', async context => {
  const photoIn = [];
  context.mock.method(User, 'findById', () => query({ _id: 'u1', social_photos: { google: GOOGLE_URL } }));
  context.mock.method(ProfileImage, 'updateOne', async () => { photoIn.push('saved'); return {}; });
  let previous = '';
  context.mock.method(User, 'findByIdAndUpdate', (id, patch) => (patch.$set?.['social_photos.google'] ? query({ avatar_source: previous }) : Promise.resolve({})));
  const fetcher = async () => okResponse();
  await images.rememberSocialPhoto({ _id: 'u1' }, 'google', GOOGLE_URL, fetcher);
  assert.deepEqual(photoIn, ['saved']);
  for (previous of ['upload', 'none', 'facebook']) await images.rememberSocialPhoto({ _id: 'u1' }, 'google', GOOGLE_URL, fetcher);
  assert.deepEqual(photoIn, ['saved']);
});

test('a broken or forged provider photo never blocks login', async context => {
  const change = context.mock.method(User, 'findByIdAndUpdate', () => query({ avatar_source: '' }));
  context.mock.method(User, 'findById', () => query({ _id: 'u1', social_photos: { google: GOOGLE_URL } }));
  await images.rememberSocialPhoto({ _id: 'u1' }, 'google', 'https://169.254.169.254/latest', async () => { throw new Error('must not fetch'); });
  assert.equal(change.mock.callCount(), 0);
  await assert.doesNotReject(images.rememberSocialPhoto({ _id: 'u1' }, 'google', GOOGLE_URL, async () => { throw new Error('network down'); }));
  await assert.doesNotReject(images.rememberSocialPhoto(null, 'google', GOOGLE_URL));
});
