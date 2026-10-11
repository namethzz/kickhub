const { fail, objectId } = require('./partyService');
const { Types } = require('mongoose');

function partySearchQuery(query = {}, now = new Date()) {
  const value = (key, fallback = '') => {
    if (query[key] === undefined) return fallback;
    if (typeof query[key] !== 'string') fail(400, 'ตัวกรองไม่ถูกต้อง');
    return query[key].trim();
  };
  const mode = value('mode', 'flexible'), access = value('access'), position = value('position');
  const sort = value('sort', 'soon'), available = value('available', '1');
  const q = value('q'), date = value('date'), maxPrice = value('maxPrice'), field = value('field'), rawPage = value('page', '1');
  if (!['flexible', 'fixed'].includes(mode) || !['', 'open', 'approval'].includes(access) || !['', 'GK', 'DF', 'MF', 'FW'].includes(position) || (position && mode !== 'fixed') || !['soon', 'price'].includes(sort) || !['0', '1'].includes(available) || q.length > 100) fail(400, 'ตัวกรองไม่ถูกต้อง');
  if (!/^\d+$/.test(rawPage) || +rawPage < 1 || +rawPage > 10000) fail(400, 'เลขหน้าไม่ถูกต้อง');
  const filter = { status: { $ne: 'cancelled' }, mode, start_datetime: { $gt: now } };
  if (field) { objectId(field); filter.field_id = new Types.ObjectId(field); }
  if (access) filter.access = access;
  if (q) {
    const literal = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = ['party_name', 'field_name', 'address'].map(key => ({ [key]: { $regex: literal, $options: 'i' } }));
  }
  if (maxPrice) {
    if (!/^\d+(\.\d{1,2})?$/.test(maxPrice) || +maxPrice > 100000) fail(400, 'งบต่อคนไม่ถูกต้อง');
    filter.price = { $lte: +maxPrice };
  }
  if (date) {
    const start = new Date(`${date}T00:00:00+07:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(+start) || new Date(+start + 7 * 3600000).toISOString().slice(0, 10) !== date) fail(400, 'วันที่ไม่ถูกต้อง');
    filter.start_datetime = { $gt: now, $gte: start, $lt: new Date(+start + 86400000) };
  }
  const participants = { $ifNull: ['$participants', []] };
  const slots = { $ifNull: ['$required_positions', []] };
  const capacity = { $cond: [{ $eq: ['$mode', 'fixed'] }, { $sum: { $map: { input: slots, as: 'slot', in: '$$slot.amount' } } }, { $ifNull: ['$total_required_players', 0] }] };
  const conditions = [];
  if (available === '1') conditions.push({ $lt: [{ $size: participants }, capacity] });
  if (position) conditions.push({ $lt: [
    { $size: { $filter: { input: participants, as: 'member', cond: { $eq: ['$$member.position', position] } } } },
    { $sum: { $map: { input: { $filter: { input: slots, as: 'slot', cond: { $eq: ['$$slot.position', position] } } }, as: 'slot', in: '$$slot.amount' } } },
  ] });
  if (conditions.length) filter.$expr = { $and: conditions };
  return { filter, page: +rawPage, pageSize: 12, sort: sort === 'price' ? { price: 1, start_datetime: 1, _id: 1 } : { start_datetime: 1, _id: 1 } };
}
module.exports = { partySearchQuery };
