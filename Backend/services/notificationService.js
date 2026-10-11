const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const types = ['request', 'submitted', 'approved', 'declined', 'joined', 'cancelled', 'updated', 'party_cancelled', 'chat'];
function addChatNotifications(post, message) {
  const recipients = new Set([String(post.user_id), ...(post.participants || []).map(member => String(member.user_id))]);
  recipients.delete(String(message.sender_id));
  post.notification_events ||= [];
  for (const recipient of recipients) {
    let event = post.notification_events.find(event => event.type === 'chat' && String(event.recipient_id) === recipient);
    if (!event) { addNotification(post, recipient, 'chat', message.sender_name); event = post.notification_events.at(-1); }
    event.actor_name = message.sender_name; event.created_at = message.created_at; event.message_id = message._id; event.read_at = undefined;
  }
}
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
  const unread = { 'notification_events.created_at': { $gt: cutoff }, 'notification_events.read_at': null };
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
          { $project: { _id: '$notification_events._id', party_id: '$_id', party_name: 1, type: '$notification_events.type', actor_name: '$notification_events.actor_name', created_at: '$notification_events.created_at', read: { $or: [{ $lte: ['$notification_events.created_at', cutoff] }, { $ne: [{ $ifNull: ['$notification_events.read_at', null] }, null] }] } } },
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
module.exports = { types, addNotification, addChatNotifications, pipeline, readThrough };
