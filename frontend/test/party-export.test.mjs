import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partyUrl, partyCalendar, shareSummary } from '../src/features/live/party-export.js';
const id = '0123456789abcdef01234567';
const now = new Date('2026-10-11T12:00:00Z');
const party = { _id: id, party_name: 'คืนวันจันทร์', field_name: 'สนามของเรา', address: 'กรุงเทพฯ', start_datetime: '2026-10-12T23:30:00+07:00', end_datetime: '2026-10-13T01:30:00+07:00', price: 120, mode: 'fixed', access: 'approval' };
const url = `https://kickhub.example/parties/${id}`;
const unfold = value => value.replace(/\r\n /g, '');
test('share link preserves deployment base path and omits credentials, queries and fragments', () => {
  assert.equal(partyUrl(id, 'https://user:secret@kickhub.example/kickhub/?token=private#fragment'), `https://kickhub.example/kickhub/parties/${id}`);
  assert.equal(partyUrl(id, 'http://localhost:5173/'), `http://localhost:5173/parties/${id}`);
  for (const bad of ['bad', '../profile', `${id}\r\nBEGIN:VEVENT`]) assert.throws(() => partyUrl(bad, 'https://kickhub.example/'));
  assert.throws(() => partyUrl(id, 'javascript:alert(1)'));
});
test('calendar converts overnight Thai times to UTC and keeps a stable event identity without member information', () => {
  const contents = unfold(partyCalendar({ ...party, participants: [{ name: 'PRIVATE PLAYER' }], join_requests: [{ name: 'PRIVATE REQUEST' }], email: 'private@example.test' }, url, now));
  assert(contents.includes('DTSTART:20261012T163000Z\r\n'));
  assert(contents.includes('DTEND:20261012T183000Z\r\n'));
  assert(contents.includes('DTSTAMP:20261011T120000Z\r\n'));
  assert(contents.includes(`UID:${id}@kickhub\r\n`));
  assert(contents.includes('SUMMARY:KickHub · คืนวันจันทร์\r\n'));
  assert.equal((contents.match(/BEGIN:VEVENT/g) || []).length, 1);
  assert(!contents.includes('PRIVATE')); assert(!contents.includes('private@example.test'));
  assert(contents.endsWith('END:VCALENDAR\r\n'));
});
test('Thai, emoji and escaped text fold at UTF-8 byte boundaries and cannot inject calendar properties', () => {
  const name = 'ฟุตบอล⚽'.repeat(35) + '\r\nBEGIN:VEVENT;,\\';
  const contents = partyCalendar({ ...party, party_name: name }, url, now);
  for (const line of contents.split('\r\n')) assert(new TextEncoder().encode(line).length <= 75);
  assert.equal((contents.match(/(?:^|\r\n)BEGIN:VEVENT\r\n/g) || []).length, 1);
  const restored = unfold(contents);
  assert(restored.includes('\\nBEGIN:VEVENT\\;\\,\\\\\r\n'));
  assert(restored.includes('ฟุตบอล⚽'.repeat(35)));
  assert(!restored.includes('\uFFFD'));
});
test('calendar rejects cancelled, finished and invalid games; share summary explains admission and Thai time', () => {
  for (const override of [{ status: 'cancelled' }, { start_datetime: 'invalid' }, { end_datetime: 'invalid' }, { end_datetime: '2026-10-10T12:00:00Z' }, { end_datetime: party.start_datetime }, { _id: 'bad' }]) assert.throws(() => partyCalendar({ ...party, ...override }, url, now));
  assert.throws(() => partyCalendar(party, `${url}\r\nBEGIN:VEVENT`, now));
  assert.throws(() => partyCalendar(party, 'javascript:alert(1)', now));
  const summary = shareSummary(party);
  assert(summary.includes('ล็อคตำแหน่ง')); assert(summary.includes('23:30')); assert(summary.includes('เวลาไทย')); assert(summary.includes('รอหัวตี้อนุมัติ'));
  assert(shareSummary({ ...party, mode: 'flexible', access: 'open' }).includes('เข้าร่วมได้เมื่อมีที่ว่าง'));
});
