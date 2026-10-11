import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessages } from '../src/features/live/chat-state.js';
const message = n => ({ _id: String(n).padStart(24, '0'), created_at: new Date(1760000000000 + n * 1000).toISOString(), text: `Message ${n}`, sender_id: 'player', sender_name: 'Player' });
test('older polling responses do not erase a just-sent message or duplicate overlapping history', () => {
  const sent = message(5);
  const current = mergeMessages([message(3), message(4)], [sent]);
  const refreshed = mergeMessages(current, [message(2), message(3), message(4)]);
  assert.deepEqual(refreshed.map(item => item.text), ['Message 2', 'Message 3', 'Message 4', 'Message 5']);
  const history = mergeMessages(refreshed, [message(0), message(1), message(2)]);
  assert.equal(history.length, 6); assert.equal(history.at(-1)._id, sent._id);
});
test('long chat sessions retain the newest 200 in stable order without mutating prior state', () => {
  const current = Array.from({ length: 200 }, (_, n) => message(n));
  const result = mergeMessages(current, [message(202), message(200), message(201)]);
  assert.equal(result.length, 200); assert.equal(result[0].text, 'Message 3'); assert.equal(result.at(-1).text, 'Message 202'); assert.equal(current[0].text, 'Message 0');
});
