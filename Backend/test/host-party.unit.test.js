const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const { updateParty, cancelParty, joinParty, reviewRequest, leaveParty, publicParty } = require('../services/partyService');
const host = new mongoose.Types.ObjectId(), player = new mongoose.Types.ObjectId(), pending = new mongoose.Types.ObjectId();
function game() {
  return new Post({ party_name: 'Friday football', description: 'Original', mode: 'flexible', access: 'approval', field_id: new mongoose.Types.ObjectId(), field_name: 'Field', address: 'Bangkok', google_map: 'https://maps.google.com/', user_id: host, host_name: 'Host', start_datetime: new Date(Date.now() + 3600000), end_datetime: new Date(Date.now() + 7200000), price: 100, total_required_players: 10, participants: [{ user_id: host, name: 'Host' }, { user_id: player, name: 'Player' }], join_requests: [{ user_id: pending, name: 'Pending', status: 'pending' }, { user_id: player, name: 'Player', status: 'approved' }, { user_id: new mongoose.Types.ObjectId(), status: 'declined' }] });
}
function setup(context, post) {
  let saves = 0;
  post.save = async () => { await post.validate(); saves++; return post; };
  context.mock.method(Post, 'findById', async () => post);
  return () => saves;
}
test('host edit validates the whole patch before changes and notifies current members/pending requests once', async context => {
  const post = game(), saves = setup(context, post);
  const originalTime = +post.start_datetime;
  await assert.rejects(() => updateParty(post._id, player, { party_name: 'Spoofed' }), error => error.status === 403);
  for (const invalid of [{ party_name: 'New', price: -1 }, { start_datetime: null }, { start_datetime: new Date(0).toISOString() }, { end_datetime: new Date(Date.now() + 8 * 3600000).toISOString() }, { total_required_players: 1 }, { status: 'cancelled' }, {}, { description: 'x'.repeat(601) }]) await assert.rejects(() => updateParty(post._id, host, invalid), error => error.status === 400);
  assert.equal(post.party_name, 'Friday football'); assert.equal(+post.start_datetime, originalTime); assert.equal(saves(), 0);
  await updateParty(post._id, host, { party_name: '  Saturday football  ', price: 120, description: ' Updated ' });
  assert.equal(post.party_name, 'Saturday football'); assert.equal(post.description, 'Updated'); assert.equal(post.price, 120); assert.equal(post.participants.length, 2); assert.equal(post.total_required_players, 10);
  assert.deepEqual(post.notification_events.map(event => String(event.recipient_id)).sort(), [String(player), String(pending)].sort());
  assert(post.notification_events.every(event => event.type === 'updated'));
  await updateParty(post._id, host, { party_name: 'Saturday football', price: 120 });
  assert.equal(post.notification_events.length, 2); assert.equal(saves(), 2);
  const rescheduled = new Date(originalTime + 3600000);
  await updateParty(post._id, host, { start_datetime: rescheduled.toISOString(), end_datetime: new Date(+rescheduled + 3600000).toISOString() });
  assert.equal(+post.start_datetime, +rescheduled); assert.equal(post.notification_events.length, 4);
  assert.equal(post.join_requests[0].status, 'pending');
  assert.equal('notification_events' in publicParty(post, player), false);
});
test('cancellation preserves party history, cancels pending requests, is idempotent and blocks all participation', async context => {
  const post = game(); setup(context, post);
  context.mock.method(User, 'findById', async () => ({ name: 'Player' }));
  await assert.rejects(() => cancelParty(post._id, player, 'No'), error => error.status === 403);
  await assert.rejects(() => cancelParty(post._id, host, 'x'.repeat(301)), error => error.status === 400);
  await cancelParty(post._id, host, '  Field unavailable  ');
  assert.equal(post.status, 'cancelled'); assert.equal(post.cancellation_reason, 'Field unavailable'); assert(post.cancelled_at instanceof Date);
  assert.equal(post.participants.length, 2); assert.equal(post.join_requests[0].status, 'cancelled'); assert.equal(post.join_requests[1].status, 'approved');
  assert.equal(post.notification_events.length, 2); assert(post.notification_events.every(event => event.type === 'party_cancelled'));
  await cancelParty(post._id, host, 'Different reason'); assert.equal(post.notification_events.length, 2); assert.equal(post.cancellation_reason, 'Field unavailable');
  await assert.rejects(() => joinParty(post._id, pending, null), error => error.status === 409);
  await assert.rejects(() => reviewRequest(post._id, post.join_requests[0]._id, host, 'approved'), error => error.status === 409);
  await assert.rejects(() => reviewRequest(post._id, post.join_requests[0]._id, host, 'declined'), error => error.status === 409);
  await assert.rejects(() => updateParty(post._id, host, { price: 10 }), error => error.status === 409);
  await assert.rejects(() => leaveParty(post._id, player), error => error.status === 409);
});
test('started games cannot be edited/cancelled and changes recheck cancellation after concurrent save conflict', async context => {
  const post = game(); setup(context, post); post.start_datetime = new Date(Date.now() - 1000);
  await assert.rejects(() => updateParty(post._id, host, { price: 30 }), error => error.status === 409);
  await assert.rejects(() => cancelParty(post._id, host), error => error.status === 409);
  const before = game(), cancelled = game(); cancelled._id = before._id; cancelled.status = 'cancelled';
  let reads = 0, writes = 0;
  context.mock.method(Post, 'findById', async () => ++reads === 1 ? before : cancelled);
  before.save = async () => { writes++; throw Object.assign(new Error('Conflict'), { name: 'VersionError' }); };
  cancelled.save = async () => { writes++; return cancelled; };
  await assert.rejects(() => updateParty(before._id, host, { price: 20 }), error => error.status === 409);
  assert.equal(reads, 2); assert.equal(writes, 1); assert.equal(cancelled.price, 100); assert.equal(cancelled.notification_events.length, 0);
});
test('host HTTP endpoints reject guests and identity spoofing, return cancellation history without notification recipients', async context => {
  const app = require('../app'), post = game(); setup(context, post);
  const oldSecret = process.env.SECRET_KEY; process.env.SECRET_KEY = 'host-actions-isolated-test-secret';
  context.mock.method(User, 'findById', id => ({ select: async () => ({ _id: id, status: 'active' }) }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/v2/parties/${post._id}`;
  const headers = actor => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ _id: actor }, process.env.SECRET_KEY)}` });
  try {
    assert.equal((await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price: 20 }) })).status, 401);
    assert.equal((await fetch(`${url}/cancel`, { method: 'POST', headers: headers(player), body: JSON.stringify({ user_id: host }) })).status, 403);
    const edited = await fetch(url, { method: 'PATCH', headers: headers(host), body: JSON.stringify({ price: 130 }) }); assert.equal(edited.status, 200); assert.equal((await edited.json()).price, 130);
    const response = await fetch(`${url}/cancel`, { method: 'POST', headers: headers(host), body: JSON.stringify({ reason: 'Rain' }) }); assert.equal(response.status, 200);
    const data = await response.json(); assert.equal(data.status, 'cancelled'); assert.equal(data.cancellation_reason, 'Rain'); assert.equal('notification_events' in data, false);
    const detail = await fetch(url, { headers: headers(player) }); assert.equal(detail.status, 200); assert.equal((await detail.json()).status, 'cancelled');
  } finally { await new Promise(resolve => server.close(resolve)); if (oldSecret === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = oldSecret; }
});
