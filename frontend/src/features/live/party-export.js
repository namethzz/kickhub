/** @typedef {Pick<import('@/lib/api').LiveParty, '_id' | 'party_name' | 'field_name' | 'address' | 'start_datetime' | 'end_datetime' | 'price' | 'mode' | 'access' | 'status'>} PartySnapshot */

/** Build a clean link without tokens, browser queries or fragments. */
export function partyUrl(id, baseUrl) {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new Error('รหัสปาร์ตี้ไม่ถูกต้อง');
  const base = new URL(baseUrl);
  if (!['https:', 'http:'].includes(base.protocol)) throw new Error('ลิงก์เว็บไซต์ไม่ถูกต้อง');
  const directory = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
  return new URL(`parties/${id}`, `${base.origin}${directory}`).href;
}

/** @param {PartySnapshot} party */
export function shareSummary(party) {
  const when = new Date(party.start_datetime).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' });
  return `${party.party_name}\n${party.mode === 'fixed' ? 'ล็อคตำแหน่ง' : 'บุฟเฟต์'} · ${party.field_name}\n${when} (เวลาไทย) · ฿${party.price.toLocaleString('th-TH')}/คน\n${party.access === 'approval' ? 'ส่งคำขอแล้วรอหัวตี้อนุมัติ' : 'เข้าร่วมได้เมื่อมีที่ว่าง'}`;
}

// RFC 5545 TEXT escaping and byte-aware line folding preserve Thai and emoji.
// eslint-disable-next-line no-control-regex -- stripping control characters is the point of this pattern.
const escapeText = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function foldLine(line) {
  const encoder = new TextEncoder(); let folded = '', bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { folded += '\r\n '; bytes = 1; }
    folded += character; bytes += size;
  }
  return folded;
}
const utc = value => {
  const date = new Date(value);
  if (!Number.isFinite(+date)) throw new Error('วันเวลาปาร์ตี้ไม่ถูกต้อง');
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};
/** @param {PartySnapshot} party */
export function partyCalendar(party, url, now = new Date()) {
  if (party.status === 'cancelled' || new Date(party.end_datetime) <= now) throw new Error('ปาร์ตี้นี้ยกเลิกหรือจบแล้ว');
  if (new Date(party.end_datetime) <= new Date(party.start_datetime)) throw new Error('วันเวลาปาร์ตี้ไม่ถูกต้อง');
  if (!/^[a-f0-9]{24}$/i.test(party._id)) throw new Error('รหัสปาร์ตี้ไม่ถูกต้อง');
  const link = new URL(url);
  if (!['http:', 'https:'].includes(link.protocol) || /[\r\n]/.test(url)) throw new Error('ลิงก์เว็บไซต์ไม่ถูกต้อง');
  const description = `${party.mode === 'fixed' ? 'ล็อคตำแหน่ง' : 'บุฟเฟต์'} · ฿${party.price}/คน\nดูนัดล่าสุด: ${link.href}\nหากหัวตี้เปลี่ยนนัดหรือยกเลิก ให้แก้ไขปฏิทินของคุณด้วย`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KickHub//Football Parties//TH', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${party._id}@kickhub`, `DTSTAMP:${utc(now)}`,
    `DTSTART:${utc(party.start_datetime)}`, `DTEND:${utc(party.end_datetime)}`,
    `SUMMARY:${escapeText(`KickHub · ${party.party_name}`)}`,
    `LOCATION:${escapeText(`${party.field_name} · ${party.address}`)}`,
    `DESCRIPTION:${escapeText(description)}`, `URL:${link.href}`, 'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
