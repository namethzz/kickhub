const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Field = require('../models/Field');
const { partyCard } = require('../services/discoveryService');

test('public discovery returns headcounts without identities or private requests', () => {
  const player = new mongoose.Types.ObjectId();
  const post = new Post({ mode: 'fixed', required_positions: [{ position: 'GK', amount: 1 }, { position: 'DF', amount: 3 }], participants: [{ user_id: player, name: 'Private member', position: 'GK' }], join_requests: [{ user_id: player, name: 'Private request', status: 'pending' }], host_name: 'Host', user_id: player, description: 'Private detail' });
  const card = partyCard(post);
  assert.equal(card.capacity, 4);
  assert.equal(card.player_count, 1);
  for (const key of ['participants', 'join_requests', 'user_id', 'host_name', 'description']) assert.equal(key in card, false);
  post.mode = 'flexible'; post.total_required_players = 24;
  assert.equal(partyCard(post).capacity, 24);
});

test('guest discovery reads active fields and future games while account routes stay protected', async context => {
  const app = require('../app');
  let fieldFilter, partyFilter;
  context.mock.method(Field, 'find', filter => {
    fieldFilter = filter;
    return { select: () => ({ sort: async () => [] }) };
  });
  context.mock.method(Post, 'find', filter => {
    partyFilter = filter;
    return { select: () => ({ sort: () => ({ limit: async () => [] }) }) };
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(`${url}/api/v2/discover?mine=host`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { fields: [], parties: [] });
    assert.deepEqual(fieldFilter, { is_active: true });
    assert.equal(partyFilter.start_datetime.$gt instanceof Date, true);
    assert.deepEqual(Object.keys(partyFilter), ['status', 'start_datetime']);
    assert.deepEqual(partyFilter.status, { $ne: 'cancelled' });
    assert.equal((await fetch(`${url}/api/v2/me`)).status, 401);
    assert.equal((await fetch(`${url}/api/v2/parties`)).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
