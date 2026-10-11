const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const { partySearchQuery } = require('../services/partySearchService');

test('search date uses Thailand midnight, excludes started/cancelled games, escapes text and bounds budget', () => {
  const now = new Date('2026-10-11T09:00:00Z');
  const query = partySearchQuery({ date: '2026-10-12', q: 'สนาม (A)+.*', maxPrice: '0', access: 'approval', page: '2', sort: 'price' }, now);
  assert.equal(query.filter.start_datetime.$gte.toISOString(), '2026-10-11T17:00:00.000Z');
  assert.equal(query.filter.start_datetime.$lt.toISOString(), '2026-10-12T17:00:00.000Z');
  assert.equal(query.filter.start_datetime.$gt, now);
  assert.deepEqual(query.filter.status, { $ne: 'cancelled' });
  assert.equal(query.filter.$or[0].party_name.$regex, 'สนาม \\(A\\)\\+\\.\\*');
  assert.deepEqual(query.filter.price, { $lte: 0 });
  assert.equal(query.filter.access, 'approval'); assert.equal(query.page, 2); assert.equal(query.pageSize, 12);
  assert.deepEqual(query.sort, { price: 1, start_datetime: 1, _id: 1 });
  const field = partySearchQuery({ field: '507f1f77bcf86cd799439011' }).filter.field_id;
  assert(field instanceof mongoose.Types.ObjectId); assert.equal(String(field), '507f1f77bcf86cd799439011');
});
test('availability compares confirmed members with capacity and chosen position, never pending requests', () => {
  const query = partySearchQuery({ mode: 'fixed', position: 'GK' });
  const expressions = JSON.stringify(query.filter.$expr);
  assert(expressions.includes('$participants')); assert(expressions.includes('$required_positions')); assert(expressions.includes('$$member.position')); assert(expressions.includes('GK'));
  assert.equal(expressions.includes('join_requests'), false);
  assert.equal(query.filter.$expr.$and.length, 2);
  assert.equal('$expr' in partySearchQuery({ available: '0' }).filter, false);
  assert.equal(partySearchQuery({ mode: 'fixed', position: 'FW', available: '0' }).filter.$expr.$and.length, 1);
});
test('invalid dates, unbounded pages, regex objects and invalid choices are rejected', () => {
  for (const query of [{ date: '2026-02-30' }, { date: '2026-2-1' }, { maxPrice: '-1' }, { maxPrice: '100001' }, { maxPrice: 'Infinity' }, { page: '0' }, { page: '10001' }, { page: '1.5' }, { q: { $regex: '.*' } }, { q: 'x'.repeat(101) }, { access: 'private' }, { position: 'GK' }, { available: 'true' }, { sort: 'random' }, { field: 'invalid' }, { mode: ['fixed', 'flexible'] }]) {
    assert.throws(() => partySearchQuery(query), error => error.status === 400);
  }
});
test('search HTTP endpoint authenticates, paginates database results and hides private requests/events', async context => {
  const actor = new mongoose.Types.ObjectId(), host = new mongoose.Types.ObjectId(), other = new mongoose.Types.ObjectId();
  const post = new Post({ party_name: 'Game', mode: 'flexible', total_required_players: 10, user_id: host, participants: [], join_requests: [{ user_id: other, name: 'Private', status: 'pending' }], notification_events: [{ recipient_id: other, type: 'request', actor_name: 'Private' }] });
  const previous = process.env.SECRET_KEY; process.env.SECRET_KEY = 'search-test-secret';
  context.mock.method(User, 'findById', () => ({ select: async () => ({ _id: actor, status: 'active' }) }));
  const aggregate = context.mock.method(Post, 'aggregate', async stages => {
    const filter = stages[0].$match;
    assert.equal(filter.mode, 'flexible');
    assert(filter.start_datetime.$gt instanceof Date);
    assert.deepEqual(stages[1].$facet, { items: [{ $sort: { start_datetime: 1, _id: 1 } }, { $skip: 12 }, { $limit: 12 }], total: [{ $count: 'count' }] });
    const legacy = post.toObject(); delete legacy.participants; delete legacy.join_requests; delete legacy.required_positions;
    return [{ total: [{ count: 25 }], items: [post.toObject(), legacy] }];
  });
  const server = require('../app').listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/v2/party-search?page=2`;
    assert.equal((await fetch(url)).status, 401); assert.equal(aggregate.mock.callCount(), 0);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${jwt.sign({ _id: actor }, process.env.SECRET_KEY)}` } });
    assert.equal(response.status, 200); const data = await response.json();
    assert.equal(data.total, 25); assert.equal(data.page, 2); assert.equal(data.pageSize, 12);
    assert.deepEqual(data.parties[0].join_requests, []); assert.equal('notification_events' in data.parties[0], false); assert.equal(data.parties[0].capacity, 10);
    assert.deepEqual(data.parties[1].participants, []); assert.deepEqual(data.parties[1].join_requests, []); assert.equal(data.parties[1].capacity, 10);
  } finally { await new Promise(resolve => server.close(resolve)); if (previous === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = previous; }
});
