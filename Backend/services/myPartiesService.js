const { fail } = require('./partyService');
function myPartyQuery(actor, query = {}, now = new Date()) {
  const scope = query.scope || 'host';
  const period = query.period || 'upcoming';
  if (!['host', 'joined', 'requested'].includes(scope) || !['upcoming', 'history'].includes(period)) fail(400, 'ตัวกรองปาร์ตี้ไม่ถูกต้อง');
  const rawPage = query.page === undefined ? '1' : query.page;
  if (typeof rawPage !== 'string' || !/^\d+$/.test(rawPage) || Number(rawPage) < 1 || Number(rawPage) > 10000) fail(400, 'เลขหน้าไม่ถูกต้อง');
  const page = Number(rawPage);
  const time = { end_datetime: period === 'history' ? { $lte: now } : { $gt: now } };
  const scopes = {
    host: { ...time, user_id: actor },
    joined: { ...time, user_id: { $ne: actor }, 'participants.user_id': actor },
    requested: { ...time, user_id: { $ne: actor }, join_requests: { $elemMatch: { user_id: actor } } },
  };
  return { scope, period, page, pageSize: 12, scopes, filter: scopes[scope], sort: { start_datetime: period === 'history' ? -1 : 1, _id: 1 } };
}
module.exports = { myPartyQuery };
