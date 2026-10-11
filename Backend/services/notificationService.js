const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const types = ['request', 'submitted', 'approved', 'declined', 'joined', 'cancelled'];
function addNotification(post, recipient, type, actorName) {
  post.notification_events ||= [];
  post.notification_events.push({ recipient_id: recipient, type, actor_name: actorName, created_at: new Date() });
  // Keep each party document bounded; this is an activity inbox, not an audit log.
  if (post.notification_events.length > 250) post.notification_events.splice(0, post.notification_events.length - 250);
}
function pipeline(actor, readAt, query = {}, asOf = new Date()) {
  const page = query.page === undefined ? '1' : query.page;
  if (typeof page !== 'string' || !/^\d+$/.test(page) || Number(page) < 1 || Number(page) > 10000 || (query.filter !== undefined && !['all', 'unread'].includes(query.filter))) fail(400, 'ตัวกรองแจ้งเตือนไม่ถูกต้อง');
  const cutoff = readAt || new Date(0);
  const unread = { 'notification_events.created_at': { $gt: cutoff } };
  return {
    page: Number(page), pageSize: 12, asOf,
    stages: [
      { $match: { 'notification_events.recipient_id': actor } },
      { $unwind: '$notification_events' },
      { $match: { 'notification_events.recipient_id': actor, 'notification_events.created_at': { $lte: asOf } } },
      { $sort: { 'notification_events.created_at': -1, 'notification_events._id': -1 } },
      { $facet: {
        unread: [{ $match: unread }, { $count: 'count' }],
        total: [...(query.filter === 'unread' ? [{ $match: unread }] : []), { $count: 'count' }],
        items: [
          ...(query.filter === 'unread' ? [{ $match: unread }] : []),
          { $skip: (Number(page) - 1) * 12 }, { $limit: 12 },
          { $project: { _id: '$notification_events._id', party_id: '$_id', party_name: 1, type: '$notification_events.type', actor_name: '$notification_events.actor_name', created_at: '$notification_events.created_at', read: { $lte: ['$notification_events.created_at', cutoff] } } },
        ],
      } },
    ],
  };
}
function readThrough(value, now = new Date()) {
  if (typeof value !== 'string') fail(400, 'เวลาที่อ่านไม่ถูกต้อง');
  const date = new Date(value);
  if (!Number.isFinite(+date) || date > now || +date < 0) fail(400, 'เวลาที่อ่านไม่ถูกต้อง');
  return date;
}
module.exports = { types, addNotification, pipeline, readThrough };
