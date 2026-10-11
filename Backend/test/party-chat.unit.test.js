const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const { readChat, sendChat, acknowledgeChat } = require('../services/partyChatService');
const { leaveParty } = require('../services/partyService');
const { publicParty } = require('../services/partyService');
const host = new mongoose.Types.ObjectId(), player = new mongoose.Types.ObjectId(), pending = new mongoose.Types.ObjectId();
function game() {
  return new Post({ party_name: 'Game', mode: 'flexible', user_id: host, host_name: 'Host', field_id: new mongoose.Types.ObjectId(), field_name: 'Field', address: 'Bangkok', google_map: 'https://maps.google.com/', price: 100, total_required_players: 10, start_datetime: new Date(Date.now() + 3600000), end_datetime: new Date(Date.now() + 7200000), participants: [{ user_id: player, name: 'Player' }], join_requests: [{ user_id: pending, name: 'Pending', status: 'pending' }] });
}
function setup(context, post) {
  let saves = 0;
  context.mock.method(Post, 'findById', () => ({ select: async selection => { assert.equal(selection, '+chat_messages'); return post; } }));
  post.save = async () => { await post.validate(); saves++; return post; };
  return () => saves;
}
test('chat history is members-only, bounded and cursor-paginated, hidden in normal party responses', async context => {
  const post = game(); setup(context, post);
  post.chat_messages = Array.from({ length: 70 }, (_, i) => ({ sender_id: host, sender_name: 'Host', text: `Message ${i}`, client_id: randomUUID(), created_at: new Date(Date.now() - 100000 + i * 1000) }));
  await assert.rejects(() => readChat(post._id, pending), error => error.status === 403);
  const latest = await readChat(post._id, player); assert.equal(latest.messages.length, 50); assert.equal(latest.messages[0].text, 'Message 20'); assert.equal(latest.hasOlder, true); assert.equal(latest.retention, 200);
  assert.equal('client_id' in latest.messages[0], false);
  const older = await readChat(post._id, host, latest.messages[0]._id); assert.equal(older.messages.length, 20); assert.equal(older.hasOlder, false);
  await assert.rejects(() => readChat(post._id, player, new mongoose.Types.ObjectId()), error => error.status === 409);
  await assert.rejects(() => readChat(post._id, player, ['invalid']), error => error.status === 400);
  for (const actor of [host, player, pending]) assert.equal('chat_messages' in publicParty(post, actor), false);
  assert.equal(Post.schema.path('chat_messages').options.select, false);
});
test('sending uses server identity, deduplicates retries, throttles spam and retains only latest 200', async context => {
  const post = game(), saves = setup(context, post);
  post.chat_messages = Array.from({ length: 200 }, () => ({ sender_id: host, sender_name: 'Host', text: 'Old', client_id: randomUUID(), created_at: new Date(Date.now() - 10000) }));
  const client_id = randomUUID(), user = { _id: player, name: 'Verified Player' };
  await assert.rejects(() => sendChat(post._id, { _id: pending, name: 'Pending' }, { text: 'Hidden', client_id }), error => error.status === 403);
  for (const data of [{ text: '', client_id }, { text: ' '.repeat(100), client_id }, { text: 'x'.repeat(1001), client_id }, { text: '\u0000', client_id }, { text: 'Hello', client_id: 'invalid' }]) await assert.rejects(() => sendChat(post._id, user, data), error => error.status === 400);
  assert.equal(saves(), 0);
  const first = await sendChat(post._id, user, { text: '  เจอกันที่สนาม\n18:00  ', client_id, sender_id: host, sender_name: 'Fake' });
  assert.equal(String(first.sender_id), String(player)); assert.equal(first.sender_name, 'Verified Player'); assert.equal(first.text, 'เจอกันที่สนาม\n18:00'); assert.equal(post.chat_messages.length, 200);
  const retry = await sendChat(post._id, user, { text: first.text, client_id }); assert.equal(String(retry._id), String(first._id)); assert.equal(post.chat_messages.length, 200);
  assert.equal(post.notification_events.length, 1); assert.equal(post.notification_events[0].type, 'chat'); assert.equal(String(post.notification_events[0].recipient_id), String(host));
  await assert.rejects(() => sendChat(post._id, user, { text: 'Different', client_id }), error => error.status === 409);
  await assert.rejects(() => sendChat(post._id, user, { text: 'More', client_id: randomUUID() }), error => error.status === 429);
});
test('chat alerts coalesce per recipient, exclude sender/pending applicants, and reset read only for a new message', async context => {
  const post = game(); setup(context, post);
  const teammate = new mongoose.Types.ObjectId(); post.participants.push({ user_id: teammate, name: 'Teammate' });
  const first = await sendChat(post._id, { _id: host, name: 'Host' }, { text: 'First', client_id: randomUUID() });
  assert.deepEqual(post.notification_events.map(event => String(event.recipient_id)).sort(), [String(player), String(teammate)].sort());
  const toPlayer = post.notification_events.find(event => String(event.recipient_id) === String(player));
  const stableId = String(toPlayer._id); toPlayer.read_at = new Date();
  const second = await sendChat(post._id, { _id: teammate, name: 'Teammate' }, { text: 'Second', client_id: randomUUID() });
  assert.equal(post.notification_events.length, 3); assert.equal(String(toPlayer._id), stableId); assert.equal(toPlayer.read_at, undefined);
  assert.equal(String(toPlayer.message_id), String(second._id)); assert.notEqual(String(first._id), String(second._id));
  assert.equal(toPlayer.actor_name, 'Teammate'); assert.equal('text' in toPlayer.toObject(), false);
  // Duplicate send must not reopen a notification already acknowledged.
  toPlayer.read_at = new Date();
  await sendChat(post._id, { _id: teammate, name: 'Teammate' }, { text: 'Second', client_id: post.chat_messages.at(-1).client_id });
  assert(toPlayer.read_at instanceof Date);
});
test('chat acknowledgement is actor/party/message scoped and leaves concurrent newer messages unread', async context => {
  const post = game(); setup(context, post);
  post.chat_messages = ['First', 'Second', 'Newer'].map(text => ({ sender_id: host, sender_name: 'Host', text, client_id: randomUUID(), created_at: new Date() }));
  const update = context.mock.method(Post, 'updateOne', async (filter, change, options) => {
    assert.equal(String(filter._id), String(post._id)); assert.equal(filter.notification_events.$elemMatch.recipient_id, player);
    const ids = options.arrayFilters[0]['event.message_id'].$in.map(String);
    assert.deepEqual(ids, post.chat_messages.slice(0, 2).map(message => String(message._id)));
    assert.equal(ids.includes(String(post.chat_messages[2]._id)), false);
    assert.equal(options.arrayFilters[0]['event.type'], 'chat'); assert.equal(change.$inc.__v, 1);
    assert.equal(filter.$or[1]['participants.user_id'], player);
    return { modifiedCount: 1 };
  });
  assert.equal((await acknowledgeChat(post._id, player, post.chat_messages[1]._id)).changed, true);
  await assert.rejects(() => acknowledgeChat(post._id, pending, post.chat_messages[1]._id), error => error.status === 403);
  await assert.rejects(() => acknowledgeChat(post._id, player, new mongoose.Types.ObjectId()), error => error.status === 409);
  await assert.rejects(() => acknowledgeChat(post._id, player, undefined), error => error.status === 400);
  assert.equal(update.mock.callCount(), 1);
});
test('leaving a party clears only the departing player chat alert', async context => {
  const post = game(); setup(context, post);
  await sendChat(post._id, { _id: host, name: 'Host' }, { text: 'Hi', client_id: randomUUID() });
  const event = post.notification_events[0];
  context.mock.method(Post, 'findById', async () => post);
  await leaveParty(post._id, player);
  assert(event.read_at instanceof Date); assert.equal(post.participants.length, 0);
  assert.equal(post.notification_events.at(-1).type, 'cancelled'); assert.equal(post.notification_events.at(-1).read_at, undefined);
});
test('cancelled/finished chat is read-only, ongoing games remain writable, and retry rechecks membership', async context => {
  const post = game(); setup(context, post); post.status = 'cancelled';
  assert.equal((await readChat(post._id, player)).readOnly, true);
  await assert.rejects(() => sendChat(post._id, { _id: host, name: 'Host' }, { text: 'No', client_id: randomUUID() }), error => error.status === 409);
  post.status = 'active'; post.start_datetime = new Date(Date.now() - 10000); post.end_datetime = new Date(Date.now() - 1);
  assert.equal((await readChat(post._id, player)).readOnly, true);
  await assert.rejects(() => sendChat(post._id, { _id: player, name: 'Player' }, { text: 'No', client_id: randomUUID() }), error => error.status === 409);
  post.end_datetime = new Date(Date.now() + 3600000);
  assert.equal((await readChat(post._id, player)).readOnly, false);
  await sendChat(post._id, { _id: player, name: 'Player' }, { text: 'Playing now', client_id: randomUUID() });
  const first = game(), removed = game(); removed.participants = []; let reads = 0, writes = 0;
  context.mock.method(Post, 'findById', () => ({ select: async () => ++reads === 1 ? first : removed }));
  first.save = async () => { writes++; throw Object.assign(new Error('Conflict'), { name: 'VersionError' }); };
  removed.save = async () => { writes++; return removed; };
  await assert.rejects(() => sendChat(first._id, { _id: player, name: 'Player' }, { text: 'After leaving', client_id: randomUUID() }), error => error.status === 403);
  assert.equal(reads, 2); assert.equal(writes, 1); assert.equal(removed.chat_messages.length, 0);
});
test('chat HTTP endpoints deny guests/pending players and do not trust supplied sender identity', async context => {
  const post = game(); setup(context, post);
  const previous = process.env.SECRET_KEY; process.env.SECRET_KEY = 'chat-isolated-test-secret';
  context.mock.method(User, 'findById', id => ({ select: async () => ({ _id: id, name: 'Authenticated', status: 'active' }) }));
  const server = require('../app').listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const headers = actor => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ _id: actor }, process.env.SECRET_KEY)}` });
  const url = `http://127.0.0.1:${server.address().port}/api/v2/parties/${post._id}/messages`;
  try {
    assert.equal((await fetch(url)).status, 401); assert.equal((await fetch(url, { headers: headers(pending) })).status, 403);
    assert.equal((await fetch(url, { method: 'POST', headers: headers(pending), body: JSON.stringify({ text: 'No', client_id: randomUUID() }) })).status, 403);
    const sent = await fetch(url, { method: 'POST', headers: headers(player), body: JSON.stringify({ text: '<script>alert(1)</script>', client_id: randomUUID(), sender_id: host }) });
    assert.equal(sent.status, 201); const message = await sent.json(); assert.equal(message.sender_id, String(player)); assert.equal(message.sender_name, 'Authenticated'); assert.equal('client_id' in message, false);
    const read = await fetch(url, { headers: headers(host) }); assert.equal(read.status, 200); assert.equal((await read.json()).messages.length, 1);
    const ack = context.mock.method(Post, 'updateOne', async filter => { assert.equal(String(filter.notification_events.$elemMatch.recipient_id), String(host)); return { modifiedCount: 1 }; });
    assert.equal((await fetch(`${url}/read`, { method: 'PATCH', headers: headers(pending), body: JSON.stringify({ message_id: message._id }) })).status, 403);
    assert.equal(ack.mock.callCount(), 0);
    const opened = await fetch(`${url}/read`, { method: 'PATCH', headers: headers(host), body: JSON.stringify({ message_id: message._id }) });
    assert.equal(opened.status, 200); assert.equal((await opened.json()).changed, true); assert.equal(ack.mock.callCount(), 1);
  } finally { await new Promise(resolve => server.close(resolve)); if (previous === undefined) delete process.env.SECRET_KEY; else process.env.SECRET_KEY = previous; }
});
