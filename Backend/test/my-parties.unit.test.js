const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const { myPartyQuery } = require('../services/myPartiesService');
test('my parties scope uses authenticated identity and separates history at end time', () => {
  const actor = new mongoose.Types.ObjectId(), other = new mongoose.Types.ObjectId(), now = new Date();
  const upcoming = myPartyQuery(actor, { scope: 'joined', user_id: String(other), mode: 'fixed', page: '2' }, now);
  assert.equal(upcoming.filter['participants.user_id'], actor);
  assert.deepEqual(upcoming.filter.user_id, { $ne: actor });
  assert.deepEqual(upcoming.filter.end_datetime, { $gt: now });
  assert.equal('mode' in upcoming.filter, false);
  assert.equal(upcoming.page, 2); assert.equal(upcoming.pageSize, 12);
  const history = myPartyQuery(actor, { scope: 'requested', period: 'history' }, now);
  assert.deepEqual(history.filter.$or, [{ end_datetime: { $lte: now } }, { status: 'cancelled' }]);
  assert.deepEqual(upcoming.filter.status, { $ne: 'cancelled' });
  assert.deepEqual(history.filter.join_requests, { $elemMatch: { user_id: actor } });
  assert.equal(history.sort.start_datetime, -1);
});
test('invalid my party filters and unbounded pagination are rejected', () => {
  for (const query of [{ scope: 'all' }, { period: 'everything' }, { page: '-1' }, { page: '1.5' }, { page: '10001' }, { page: ['1', '2'] }]) assert.throws(() => myPartyQuery('actor', query), error => error.status === 400);
});
test('my party HTTP route blocks guests, scopes every count/list to actor and hides other requests', async context => {
  const app = require('../app');
  const actor = new mongoose.Types.ObjectId(), host = new mongoose.Types.ObjectId(), other = new mongoose.Types.ObjectId();
  const post = new Post({ party_name: 'Private game', mode: 'flexible', total_required_players: 20, user_id: host, participants: [], join_requests: [{ user_id: actor, name: 'Me', status: 'declined' }, { user_id: other, name: 'Private other', status: 'pending' }] });
  const oldSecret = process.env.SECRET_KEY; process.env.SECRET_KEY = 'my-parties-isolated-test-secret';
  context.mock.method(User, 'findById', id => { assert.equal(id, String(actor)); return { select: async () => ({ _id: actor, status: 'active' }) }; });
  const counts = context.mock.method(Post, 'countDocuments', async filter => {
    assert(filter.end_datetime.$gt instanceof Date);
    if (filter.join_requests) { assert.equal(filter.join_requests.$elemMatch.user_id, actor); return 13; }
    if (filter['participants.user_id']) { assert.equal(filter['participants.user_id'], actor); return 2; }
    assert.equal(filter.user_id, actor); return 3;
  });
  const find = context.mock.method(Post, 'find', filter => {
    assert.equal(filter.join_requests.$elemMatch.user_id, actor);
    return { sort: order => { assert.deepEqual(order, { start_datetime: 1, _id: 1 }); return { skip: offset => { assert.equal(offset, 12); return { limit: async size => { assert.equal(size, 12); return [post]; } }; } }; } };
  });
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/v2/my-parties?scope=requested&page=2&user_id=${other}`;
  try {
    assert.equal((await fetch(url)).status, 401); assert.equal(find.mock.callCount(), 0);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${jwt.sign({ _id: actor }, process.env.SECRET_KEY)}` } });
    assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.actor_id, String(actor)); assert.equal(data.total, 13); assert.equal(data.page, 2); assert.deepEqual(data.counts, { host: 3, joined: 2, requested: 13 });
    assert.equal(data.parties[0].join_requests.length, 1); assert.equal(data.parties[0].join_requests[0].user_id, String(actor)); assert.equal(data.parties[0].join_requests[0].status, 'declined'); assert.equal(data.parties[0].capacity, 20);
    assert.equal(counts.mock.callCount(), 3);
  } finally { await new Promise(resolve => server.close(resolve)); if (oldSecret === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = oldSecret; }
});
