const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const { pipeline, readThrough, addNotification } = require('../services/notificationService');
const { joinParty, reviewRequest, leaveParty, publicParty } = require('../services/partyService');
const host = new mongoose.Types.ObjectId(), player = new mongoose.Types.ObjectId();
function party() { return new Post({ party_name: 'Game', mode: 'fixed', access: 'approval', user_id: host, host_name: 'Host', start_datetime: new Date(Date.now() + 3600000), end_datetime: new Date(Date.now() + 7200000), required_positions: [{ position: 'GK', amount: 1 }, { position: 'DF', amount: 1 }], participants: [{ user_id: host, name: 'Host', position: 'DF' }] }); }
test('join, approve and cancel save notifications with the same party mutation, never expose event recipients', async context => {
  const post = party(); let saves = 0;
  post.save = async () => { saves++; return post; };
  context.mock.method(Post, 'findById', async () => post);
  context.mock.method(User, 'findById', async () => ({ name: 'Player' }));
  context.mock.method(User, 'exists', async () => true);
  await joinParty(post._id, player, 'GK');
  assert.equal(saves, 1); assert.equal(post.notification_events.length, 2);
  assert.equal(String(post.notification_events[0].recipient_id), String(host));
  assert.equal(post.notification_events[0].type, 'request');
  assert.equal(String(post.notification_events[1].recipient_id), String(player));
  assert.equal(post.notification_events[1].type, 'submitted');
  await assert.rejects(() => reviewRequest(post._id, post.join_requests[0]._id, player, 'approved'), error => error.status === 403);
  assert.equal(post.notification_events.length, 2);
  await reviewRequest(post._id, post.join_requests[0]._id, host, 'approved');
  assert.equal(saves, 2); assert.equal(post.notification_events[2].type, 'approved');
  assert.equal(String(post.notification_events[2].recipient_id), String(player));
  for (const actor of [host, player, new mongoose.Types.ObjectId()]) assert.equal('notification_events' in publicParty(post, actor), false);
  await leaveParty(post._id, player); assert.equal(saves, 3); assert.equal(post.notification_events[3].type, 'cancelled');
  await leaveParty(post._id, player); assert.equal(post.notification_events.length, 4);
});
test('full games and duplicate requests generate no false alerts; inbox retention is bounded', async context => {
  const post = party(); post.save = async () => post;
  context.mock.method(Post, 'findById', async () => post); context.mock.method(User, 'findById', async () => ({ name: 'Player' }));
  await joinParty(post._id, player, 'GK');
  await assert.rejects(() => joinParty(post._id, player, 'GK'), error => error.status === 409); assert.equal(post.notification_events.length, 2);
  post.participants.push({ user_id: new mongoose.Types.ObjectId(), position: 'GK' });
  await assert.rejects(() => joinParty(post._id, new mongoose.Types.ObjectId(), 'GK'), error => error.status === 409); assert.equal(post.notification_events.length, 2);
  for (let i = 0; i < 300; i++) addNotification(post, host, 'joined', `Player ${i}`);
  assert.equal(post.notification_events.length, 250); assert.equal(post.notification_events[249].actor_name, 'Player 299');
});
test('notification pipeline isolates recipient after unwind, bounds pages and avoids client-controlled read times', () => {
  const at = new Date(), readAt = new Date(+at - 1000);
  const query = pipeline(player, readAt, { filter: 'unread', page: '2', user_id: String(host) }, at);
  assert.deepEqual(query.stages[2].$match, { 'notification_events.recipient_id': player, 'notification_events.created_at': { $lte: at } });
  assert.equal(query.stages.at(-1).$facet.items[0].$match['notification_events.created_at'].$gt, readAt);
  for (const invalid of [{ page: '-1' }, { page: '10001' }, { filter: 'other' }]) assert.throws(() => pipeline(player, null, invalid), error => error.status === 400);
  for (const value of [undefined, 'bad', new Date(+at + 1000).toISOString()]) assert.throws(() => readThrough(value, at), error => error.status === 400);
  assert.equal(+readThrough(at.toISOString(), at), +at);
});
test('notification HTTP routes block guests and read acknowledgement changes only authenticated user using monotonic update', async context => {
  const app = require('../app'), oldSecret = process.env.SECRET_KEY;
  process.env.SECRET_KEY = 'notifications-isolated-test-secret';
  context.mock.method(User, 'findById', () => ({ select: async () => ({ _id: player, status: 'active' }) }));
  const aggregate = context.mock.method(Post, 'aggregate', async stages => { assert.equal(stages[2].$match['notification_events.recipient_id'], player); return [{ unread: [{ count: 2 }], total: [{ count: 2 }], items: [] }]; });
  const update = context.mock.method(User, 'updateOne', async (filter, change) => { assert.deepEqual(filter, { _id: player }); assert(change.$max.notifications_read_at instanceof Date); assert.equal('$set' in change, false); return {}; });
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/v2/notifications`;
  const headers = { Authorization: `Bearer ${jwt.sign({ _id: player }, process.env.SECRET_KEY)}`, 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(url)).status, 401); assert.equal(aggregate.mock.callCount(), 0);
    const response = await fetch(url, { headers }); assert.equal(response.status, 200); const data = await response.json(); assert.equal(data.unread, 2); assert.equal(data.total, 2);
    assert.equal((await fetch(`${url}/read`, { headers, method: 'PATCH', body: JSON.stringify({ through: data.asOf, user_id: host }) })).status, 200);
    assert.equal(update.mock.callCount(), 1);
    assert.equal((await fetch(`${url}/read`, { headers, method: 'PATCH', body: JSON.stringify({ through: new Date(Date.now() + 100000).toISOString() }) })).status, 400); assert.equal(update.mock.callCount(), 1);
  } finally { await new Promise(resolve => server.close(resolve)); if (oldSecret === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = oldSecret; }
});
