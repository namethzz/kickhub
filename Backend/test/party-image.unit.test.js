const { test } = require('node:test');
const assert = require('node:assert/strict');
const Post = require('../models/Post');
const PartyImage = require('../models/PartyImage');
const images = require('../services/partyImageService');
const { publicParty, coverUrl } = require('../services/partyService');
const { partyCard } = require('../services/discoveryService');

const ID = '64b7f0c2a1b2c3d4e5f60718';
const query = value => ({ select: async () => value });
const jpeg = (size = 64) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(size)]);
const upcoming = (extra = {}) => ({ _id: ID, user_id: 'host', status: 'active', start_datetime: new Date(Date.now() + 3600000), ...extra });

test('saveCover rejects empty, oversized and non-image uploads before touching the database', async context => {
  const find = context.mock.method(Post, 'findById', () => query(upcoming()));
  const update = context.mock.method(PartyImage, 'updateOne', async () => ({}));
  await assert.rejects(images.saveCover(ID, 'host', Buffer.alloc(0)), error => error.status === 400);
  await assert.rejects(images.saveCover(ID, 'host', 'text'), error => error.status === 400);
  await assert.rejects(images.saveCover(ID, 'host', jpeg(images.MAX_BYTES)), error => error.status === 413);
  await assert.rejects(images.saveCover(ID, 'host', Buffer.from('<svg onload=alert(1)></svg>--------')), error => error.status === 415);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

test('only the host can change the cover of an upcoming, active party', async context => {
  const update = context.mock.method(PartyImage, 'updateOne', async () => ({}));
  context.mock.method(Post, 'updateOne', async () => ({}));
  const find = context.mock.method(Post, 'findById', () => query(upcoming()));
  await assert.rejects(images.saveCover('not-an-id', 'host', jpeg()), error => error.status === 400);
  await assert.rejects(images.saveCover(ID, 'someone-else', jpeg()), error => error.status === 403);
  find.mock.mockImplementation(() => query(null));
  await assert.rejects(images.saveCover(ID, 'host', jpeg()), error => error.status === 404);
  find.mock.mockImplementation(() => query(upcoming({ status: 'cancelled' })));
  await assert.rejects(images.saveCover(ID, 'host', jpeg()), error => error.status === 409);
  find.mock.mockImplementation(() => query(upcoming({ start_datetime: new Date(Date.now() - 1000) })));
  await assert.rejects(images.saveCover(ID, 'host', jpeg()), error => error.status === 409);
  await assert.rejects(images.removeCover(ID, 'someone-else'), error => error.status === 403);
  assert.equal(update.mock.callCount(), 0);
});

test('saveCover stores the image by byte-sniffed type and versions the URL', async context => {
  const stored = context.mock.method(PartyImage, 'updateOne', async () => ({}));
  const post = context.mock.method(Post, 'updateOne', async () => ({}));
  context.mock.method(Post, 'findById', () => query(upcoming()));
  const result = await images.saveCover(ID, 'host', jpeg());
  assert.deepEqual(stored.mock.calls[0].arguments[0], { post_id: ID });
  assert.equal(stored.mock.calls[0].arguments[1].$set.content_type, 'image/jpeg');
  assert.equal(stored.mock.calls[0].arguments[2].upsert, true);
  assert.deepEqual(post.mock.calls[0].arguments[0], { _id: ID });
  assert.ok(post.mock.calls[0].arguments[1].$set.image_updated_at instanceof Date);
  assert.match(result.cover_url, new RegExp(`^/api/v2/parties/${ID}/cover\\?v=\\d+$`));
});

test('removeCover deletes the image and clears the version', async context => {
  const gone = context.mock.method(PartyImage, 'deleteOne', async () => ({}));
  const post = context.mock.method(Post, 'updateOne', async () => ({}));
  context.mock.method(Post, 'findById', () => query(upcoming()));
  assert.deepEqual(await images.removeCover(ID, 'host'), { cover_url: '' });
  assert.deepEqual(gone.mock.calls[0].arguments[0], { post_id: ID });
  assert.ok('image_updated_at' in post.mock.calls[0].arguments[1].$unset);
});

test('readCover returns the stored bytes or a clear 404', async context => {
  const find = context.mock.method(PartyImage, 'findOne', async () => null);
  await assert.rejects(images.readCover(ID), error => error.status === 404);
  await assert.rejects(images.readCover('nope'), error => error.status === 400);
  find.mock.mockImplementation(async () => ({ content_type: 'image/png', data: jpeg(), updatedAt: new Date(1) }));
  const cover = await images.readCover(ID);
  assert.equal(cover.contentType, 'image/png');
  assert.ok(Buffer.isBuffer(cover.data));
});

test('party responses expose a versioned cover_url and never the raw timestamp', () => {
  assert.equal(coverUrl({ _id: ID }), '');
  assert.equal(coverUrl({ _id: ID, image_updated_at: new Date(1234) }), `/api/v2/parties/${ID}/cover?v=1234`);
  const post = { _id: ID, user_id: 'host', mode: 'flexible', total_required_players: 10, participants: [], join_requests: [], image_updated_at: new Date(99) };
  const result = publicParty(post, 'host');
  assert.equal(result.cover_url, `/api/v2/parties/${ID}/cover?v=99`);
  assert.equal('image_updated_at' in result, false);
  assert.equal(publicParty({ ...post, image_updated_at: undefined }, 'host').cover_url, '');
  assert.equal(partyCard({ ...post, party_name: 'x' }).cover_url, `/api/v2/parties/${ID}/cover?v=99`);
});
