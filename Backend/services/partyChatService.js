const Post = require('../models/Post');
const { fail, objectId, mutate } = require('./partyService');
const { addChatNotifications } = require('./notificationService');
const LIMIT = 50, RETENTION = 200;

function memberOnly(post, actor) {
  if (String(post.user_id) !== String(actor) && !(post.participants || []).some(member => String(member.user_id) === String(actor))) fail(403, 'แชตเปิดให้หัวตี้และสมาชิกที่เข้าร่วมแล้วเท่านั้น');
}
function chatState(post, now = new Date()) {
  const reason = post.status === 'cancelled' ? 'ปาร์ตี้ถูกยกเลิกแล้ว อ่านประวัติแชตได้เท่านั้น' : post.end_datetime <= now ? 'ปาร์ตี้จบแล้ว อ่านประวัติแชตได้เท่านั้น' : '';
  return { readOnly: !!reason, reason };
}
function publicMessage(message) {
  return { _id: message._id, sender_id: message.sender_id, sender_name: message.sender_name, text: message.text, created_at: message.created_at };
}
async function readChat(id, actor, before) {
  objectId(id); if (before !== undefined) objectId(before);
  const post = await Post.findById(id).select('+chat_messages');
  if (!post) fail(404, 'ไม่พบปาร์ตี้'); memberOnly(post, actor);
  const messages = post.chat_messages || [];
  const end = before === undefined ? messages.length : messages.findIndex(message => String(message._id) === String(before));
  if (end < 0) fail(409, 'ข้อความเก่าถูกนำออกจากประวัติแล้ว กรุณาโหลดแชตใหม่');
  const start = Math.max(0, end - LIMIT);
  return { ...chatState(post), messages: messages.slice(start, end).map(publicMessage), hasOlder: start > 0, retention: RETENTION };
}
async function sendChat(id, user, data) {
  const text = typeof data?.text === 'string' ? data.text.trim() : '';
  const clientId = data?.client_id;
  if (!text || text.length > 1000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text) || typeof clientId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) fail(400, 'ข้อความต้องมี 1–1,000 ตัวอักษร และรหัสข้อความต้องถูกต้อง');
  const post = await mutate(id, post => {
    memberOnly(post, user._id);
    const messages = post.chat_messages || [];
    const existing = messages.find(message => String(message.sender_id) === String(user._id) && message.client_id === clientId);
    if (existing) { if (existing.text !== text) fail(409, 'รหัสข้อความนี้ถูกใช้แล้ว'); return; }
    const state = chatState(post); if (state.readOnly) fail(409, state.reason);
    const last = [...messages].reverse().find(message => String(message.sender_id) === String(user._id));
    if (last && Date.now() - +last.created_at < 3000) fail(429, 'ส่งข้อความเร็วเกินไป กรุณารอ 3 วินาที');
    post.chat_messages = [...messages.slice(-(RETENTION - 1)), { sender_id: user._id, sender_name: user.name, client_id: clientId, text, created_at: new Date() }];
    addChatNotifications(post, post.chat_messages.at(-1));
  }, '+chat_messages');
  return publicMessage(post.chat_messages.find(message => String(message.sender_id) === String(user._id) && message.client_id === clientId));
}
async function acknowledgeChat(id, actor, messageId) {
  objectId(id); objectId(messageId);
  const post = await Post.findById(id).select('+chat_messages');
  if (!post) fail(404, 'ไม่พบปาร์ตี้'); memberOnly(post, actor);
  const index = (post.chat_messages || []).findIndex(message => String(message._id) === String(messageId));
  if (index < 0) fail(409, 'ข้อความนี้ไม่อยู่ในประวัติแล้ว กรุณาโหลดแชตใหม่');
  const ids = post.chat_messages.slice(0, index + 1).map(message => message._id);
  // An incoming message after this snapshot has a different id, even in the same millisecond.
  const event = { recipient_id: actor, type: 'chat', message_id: { $in: ids }, read_at: null };
  const result = await Post.updateOne({ _id: id, $or: [{ user_id: actor }, { 'participants.user_id': actor }], notification_events: { $elemMatch: event } },
    { $set: { 'notification_events.$[event].read_at': new Date() }, $inc: { __v: 1 } },
    { arrayFilters: [{ 'event.recipient_id': actor, 'event.type': 'chat', 'event.message_id': { $in: ids }, 'event.read_at': null }] });
  return { status: 'ok', changed: !!result.modifiedCount };
}
module.exports = { readChat, sendChat, acknowledgeChat, memberOnly, chatState };
