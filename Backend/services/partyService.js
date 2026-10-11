const mongoose = require('mongoose');
const Post = require('../models/Post');
const Field = require('../models/Field');
const User = require('../models/User');
const { addNotification } = require('./notificationService');
const codes = ['GK', 'DF', 'MF', 'FW'];
function fail(status, message) { throw Object.assign(new Error(message), { status }); }
function objectId(id) { if (!mongoose.isObjectIdOrHexString(id)) fail(400, 'รหัสข้อมูลไม่ถูกต้อง'); return id; }
function capacity(post) { return post.mode === 'fixed' ? post.required_positions.reduce((sum, slot) => sum + slot.amount, 0) : post.total_required_players; }
function hostOnly(post, actor) { if (String(post.user_id) !== String(actor)) fail(403, 'เฉพาะหัวตี้เท่านั้นที่จัดการปาร์ตี้นี้ได้'); }
function hasSpace(post, position) {
  if (post.start_datetime <= new Date()) fail(409, 'ปาร์ตี้เริ่มแล้ว ไม่สามารถรับผู้เล่นเพิ่มได้');
  if (!Number.isInteger(capacity(post)) || post.participants.length >= capacity(post)) fail(409, 'ผู้เล่นครบแล้ว');
  if (post.mode === 'fixed') {
    const slot = post.required_positions.find(slot => slot.position === position);
    if (!slot || slot.amount <= post.participants.filter(member => member.position === position).length) fail(409, 'ตำแหน่งนี้เต็มแล้วหรือไม่ได้เปิดรับ');
  }
}
function positionFor(post, position) { if (post.mode === 'fixed' && !codes.includes(position)) fail(400, 'กรุณาเลือกตำแหน่ง'); return post.mode === 'fixed' ? position : null; }
async function mutate(id, action) {
  objectId(id);
  for (let attempt = 0; attempt < 5; attempt++) {
    const post = await Post.findById(id); if (!post) fail(404, 'ไม่พบปาร์ตี้');
    await action(post);
    try { await post.save(); return post; } catch (error) { if (error.name !== 'VersionError') throw error; }
  }
  fail(409, 'มีการเปลี่ยนแปลงพร้อมกัน กรุณาลองใหม่');
}
async function createParty(actor, fieldId, data) {
  objectId(fieldId);
  const [field, user] = await Promise.all([Field.findById(fieldId), User.findById(actor)]);
  if (!field || !field.is_active) fail(404, 'สนามนี้ไม่เปิดใช้งาน'); if (!user) fail(401, 'ไม่พบบัญชี');
  const name = typeof data.party_name === 'string' ? data.party_name.trim() : '';
  if (!name || name.length > 200) fail(400, 'ชื่อปาร์ตี้ต้องมี 1–200 ตัวอักษร');
  if (!['fixed', 'flexible'].includes(data.mode)) fail(400, 'โหมดไม่ถูกต้อง');
  const start = new Date(data.start_datetime), end = new Date(data.end_datetime);
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || start <= new Date() || end <= start || end - start > 6 * 3600000) fail(400, 'วันเวลาปาร์ตี้ไม่ถูกต้อง');
  if (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0 || data.price > 100000) fail(400, 'ราคาต่อคนไม่ถูกต้อง');
  const access = data.access || (data.mode === 'fixed' ? 'approval' : 'open');
  if (!['open', 'approval'].includes(access)) fail(400, 'การเข้าร่วมไม่ถูกต้อง');
  const slots = data.mode === 'fixed' ? data.required_positions : [];
  if (data.mode === 'fixed' && (!Array.isArray(slots) || slots.length !== 4 || slots.some(slot => !slot || typeof slot !== 'object') || new Set(slots.map(slot => slot.position)).size !== 4 || slots.some(slot => !codes.includes(slot.position) || !Number.isInteger(slot.amount) || slot.amount < 0 || slot.amount > 40))) fail(400, 'จำนวนตำแหน่งไม่ถูกต้อง');
  const post = new Post({ party_name: name, mode: data.mode, access, field_id: field._id, field_name: field.field_name, address: field.address, google_map: field.google_map, user_id: user._id, host_name: user.name, description: typeof data.description === 'string' ? data.description.slice(0,600) : '', start_datetime: start, end_datetime: end, price: data.price, required_positions: slots, total_required_players: data.total_required_players });
  if (!Number.isInteger(capacity(post)) || capacity(post) < 2 || capacity(post) > 40) fail(400, 'ผู้เล่นรวมต้องมี 2–40 คน');
  const position = positionFor(post, data.position); hasSpace(post, position);
  post.participants.push({ user_id: user._id, name: user.name, position, status: 'Joined' });
  return post.save();
}
async function joinParty(id, actor, position) {
  const user = await User.findById(actor); if (!user) fail(401, 'ไม่พบบัญชี');
  return mutate(id, post => {
    if (post.participants.some(member => String(member.user_id) === String(actor))) fail(409, 'คุณเข้าร่วมแล้ว');
    const chosen = positionFor(post, position); hasSpace(post, chosen);
    let request = post.join_requests.find(request => String(request.user_id) === String(actor));
    if (request?.status === 'pending') fail(409, 'คุณมีคำขอรออนุมัติอยู่แล้ว');
    if (post.access === 'approval') {
      if (request) { request.position = chosen; request.status = 'pending'; request.requested_at = new Date(); request.reviewed_at = undefined; }
      else post.join_requests.push({ user_id: actor, name: user.name, position: chosen, status: 'pending' });
      addNotification(post, post.user_id, 'request', user.name);
      addNotification(post, actor, 'submitted', user.name);
    } else {
      post.participants.push({ user_id: actor, name: user.name, position: chosen, status: 'Joined' });
      addNotification(post, post.user_id, 'joined', user.name);
    }
  });
}
async function reviewRequest(id, requestId, actor, decision) {
  objectId(requestId); if (!['approved','declined'].includes(decision)) fail(400, 'ผลการอนุมัติไม่ถูกต้อง');
  return mutate(id, async post => {
    hostOnly(post, actor); const request = post.join_requests.id(requestId);
    if (!request) fail(404, 'ไม่พบคำขอ'); if (request.status !== 'pending') fail(409, 'คำขอนี้ถูกจัดการแล้ว');
    if (decision === 'approved') {
      if (!await User.exists({ _id: request.user_id, status: 'active' })) fail(409, 'บัญชีผู้เล่นนี้ไม่เปิดใช้งาน');
      hasSpace(post, request.position);
      if (post.participants.some(member => String(member.user_id) === String(request.user_id))) fail(409, 'ผู้เล่นนี้เข้าร่วมแล้ว');
      post.participants.push({ user_id: request.user_id, name: request.name, position: request.position, status: 'Joined' });
    }
    request.status = decision; request.reviewed_at = new Date();
    addNotification(post, request.user_id, decision, post.host_name);
  });
}
async function leaveParty(id, actor) {
  return mutate(id, post => {
    if (String(post.user_id) === String(actor)) fail(409, 'หัวตี้ไม่สามารถออกจากปาร์ตี้ของตนเองได้');
    if (post.start_datetime <= new Date()) fail(409, 'ปาร์ตี้เริ่มแล้ว ไม่สามารถยกเลิกได้');
    const member = post.participants.find(member => String(member.user_id) === String(actor));
    post.participants = post.participants.filter(member => String(member.user_id) !== String(actor));
    const request = post.join_requests.find(request => String(request.user_id) === String(actor));
    const activeRequest = request && ['pending', 'approved'].includes(request.status);
    if (activeRequest) { request.status = 'cancelled'; request.reviewed_at = new Date(); }
    if (member || activeRequest) addNotification(post, post.user_id, 'cancelled', member?.name || request.name);
  });
}
function publicParty(post, actor) {
  const result = post.toObject ? post.toObject() : { ...post };
  delete result.__v;
  delete result.notification_events;
  result.capacity = capacity(post);
  result.join_requests = String(post.user_id) === String(actor) ? result.join_requests : result.join_requests.filter(request => String(request.user_id) === String(actor));
  return result;
}
module.exports = { fail, objectId, capacity, hostOnly, hasSpace, mutate, createParty, joinParty, reviewRequest, leaveParty, publicParty };
