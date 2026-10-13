const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Post = require('../models/Post');
const Field = require('../models/Field');
const service = require('../services/partyService');
const notificationService = require('../services/notificationService');
const { myPartyQuery } = require('../services/myPartiesService');
const { partyCard } = require('../services/discoveryService');
const { partySearchQuery } = require('../services/partySearchService');
const chat = require('../services/partyChatService');
const images = require('../services/profileImageService');
const partyImages = require('../services/partyImageService');
const publicProfile = user => ({ _id: user._id, name: user.name, bio: user.bio, area: user.area, preferred_position: user.preferred_position, level: user.level, role: user.role, avatar_url: images.imageUrl(user, 'avatar'), cover_url: images.imageUrl(user, 'cover') });
// Only the owner learns which provider photos they can switch to; the stored URLs themselves are never returned.
const ownProfile = user => ({ ...publicProfile(user), email: user.email, avatar_source: user.avatar_source || '', social_photos: { google: !!user.social_photos?.google, facebook: !!user.social_photos?.facebook } });
router.get('/discover', async (req, res) => {
  const [fields, parties] = await Promise.all([
    Field.find({ is_active: true }).select('field_name field_type address price image open close facilities price_note hours_note').sort({ createdAt: -1 }),
    Post.find({ status: { $ne: 'cancelled' }, start_datetime: { $gt: new Date() } }).select('party_name mode access field_id field_name address start_datetime end_datetime price required_positions total_required_players participants image_updated_at').sort({ start_datetime: 1 }).limit(100),
  ]);
  res.json({ fields, parties: parties.map(partyCard) });
});
router.get('/profiles/:id', async (req, res) => {
  service.objectId(req.params.id);
  const user = await User.findOne({ _id: req.params.id, status: 'active' });
  if (!user) service.fail(404, 'ไม่พบโปรไฟล์');
  res.json(publicProfile(user));
});
for (const kind of ['avatar', 'cover']) {
  router.get(`/profiles/:id/${kind}`, async (req, res) => {
    service.objectId(req.params.id);
    const image = await images.readImage(req.params.id, kind);
    // The URL carries ?v=<timestamp>, so a changed photo always gets a new URL and old ones can be cached for good.
    res.set({ 'Content-Type': image.contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'", 'Cross-Origin-Resource-Policy': 'cross-origin' }).end(image.data);
  });
}
// Public like profile photos: an <img> tag cannot send the login token. The URL carries ?v=<timestamp> for caching.
router.get('/parties/:id/cover', async (req, res) => {
  const image = await partyImages.readCover(req.params.id);
  res.set({ 'Content-Type': image.contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'", 'Cross-Origin-Resource-Policy': 'cross-origin' }).end(image.data);
});
router.use(auth);
router.get('/notifications', async (req, res) => {
  const query = notificationService.pipeline(req.user._id, req.user.notifications_read_at, req.query);
  const [result] = await Post.aggregate(query.stages);
  res.json({ items: result?.items || [], total: result?.total?.[0]?.count || 0, unread: result?.unread?.[0]?.count || 0, asOf: query.asOf, page: query.page, pageSize: query.pageSize });
});
router.patch('/notifications/read', async (req, res) => {
  const through = notificationService.readThrough(req.body.through);
  await User.updateOne({ _id: req.user._id }, { $max: { notifications_read_at: through } });
  res.json({ status: 'ok' });
});
router.patch('/notifications/:id/read', async (req, res) => {
  service.objectId(req.params.id);
  await Post.updateOne({ notification_events: { $elemMatch: { _id: req.params.id, recipient_id: req.user._id, type: { $ne: 'chat' }, read_at: null } } },
    { $set: { 'notification_events.$[event].read_at': new Date() }, $inc: { __v: 1 } },
    { arrayFilters: [{ 'event._id': req.params.id, 'event.recipient_id': req.user._id, 'event.type': { $ne: 'chat' }, 'event.read_at': null }] });
  res.json({ status: 'ok' });
});
router.patch('/parties/:id/notifications/read', async (req, res) => {
  service.objectId(req.params.id);
  const through = notificationService.readThrough(req.body?.through);
  await Post.updateOne({ _id: req.params.id, notification_events: { $elemMatch: { recipient_id: req.user._id, created_at: { $lte: through }, type: { $nin: ['request', 'chat'] }, read_at: null } } },
    { $set: { 'notification_events.$[event].read_at': new Date() }, $inc: { __v: 1 } },
    { arrayFilters: [{ 'event.recipient_id': req.user._id, 'event.created_at': { $lte: through }, 'event.type': { $nin: ['request', 'chat'] }, 'event.read_at': null }] });
  res.json({ status: 'ok' });
});
router.get('/me', (req,res) => res.json(ownProfile(req.user)));
router.patch('/me', async (req,res) => {
  const data = req.body;
  const update = {};
  for (const [key,max] of [['name',100],['bio',600],['area',100]]) if (key in data) {
    if (typeof data[key] !== 'string' || data[key].trim().length > max || (key === 'name' && !data[key].trim())) service.fail(400,'ข้อมูลโปรไฟล์ไม่ถูกต้อง');
    update[key] = data[key].trim();
  }
  if ('preferred_position' in data) { if (!['GK','DF','MF','FW',''].includes(data.preferred_position)) service.fail(400,'ตำแหน่งไม่ถูกต้อง'); update.preferred_position = data.preferred_position; }
  if ('level' in data) { if (!['beginner','casual','experienced'].includes(data.level)) service.fail(400,'ระดับไม่ถูกต้อง'); update.level = data.level; }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, {new:true,runValidators:true});
  res.json(ownProfile(user));
});
const rawImage = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '2mb' });
const readImageBody = (req, res, next) => rawImage(req, res, error => {
  if (error) return next(Object.assign(new Error(error.status === 413 ? 'ไฟล์รูปใหญ่เกินไป' : 'อ่านไฟล์รูปไม่สำเร็จ'), { status: error.status === 413 ? 413 : 400 }));
  if (!Buffer.isBuffer(req.body)) return next(Object.assign(new Error('รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP'), { status: 415 }));
  next();
});
for (const kind of ['avatar', 'cover']) {
  router.put(`/me/${kind}`, readImageBody, async (req, res) => res.json(ownProfile(await images.saveImage(req.user._id, kind, req.body))));
  router.delete(`/me/${kind}`, async (req, res) => res.json(ownProfile(await images.removeImage(req.user._id, kind))));
}
router.put('/parties/:id/cover', readImageBody, async (req, res) => res.json(await partyImages.saveCover(req.params.id, req.user._id, req.body)));
router.delete('/parties/:id/cover', async (req, res) => res.json(await partyImages.removeCover(req.params.id, req.user._id)));
router.post('/me/avatar/social', async (req, res) => res.json(ownProfile(await images.importSocialPhoto(req.user._id, req.body?.provider))));
router.get('/fields', async (req,res) => res.json(await Field.find({is_active:true}).select('field_name field_type address price image open close facilities price_note hours_note').sort({createdAt:-1})));
router.get('/fields/:id', async (req,res) => {
  service.objectId(req.params.id);
  const field = await Field.findOne({_id:req.params.id,is_active:true}).select('field_name field_type address price image open close facilities price_note hours_note description google_map mobile_number owner_id');
  if (!field) service.fail(404,'ไม่พบสนาม หรือสนามนี้พักการเปิดรับแล้ว');
  res.json(field);
});
router.get('/my-parties', async (req, res) => {
  const query = myPartyQuery(req.user._id, req.query);
  const [host, joined, requested, posts] = await Promise.all([
    Post.countDocuments(query.scopes.host),
    Post.countDocuments(query.scopes.joined),
    Post.countDocuments(query.scopes.requested),
    Post.find(query.filter).sort(query.sort).skip((query.page - 1) * query.pageSize).limit(query.pageSize),
  ]);
  const counts = { host, joined, requested };
  res.json({ actor_id: req.user._id, counts, total: counts[query.scope], page: query.page, pageSize: query.pageSize, parties: posts.map(post => service.publicParty(post, req.user._id)) });
});
router.get('/parties', async (req,res) => {
  const filter = { status: { $ne: 'cancelled' }, end_datetime: { $gt: new Date() } };
  if (req.query.field) { service.objectId(req.query.field); filter.field_id = req.query.field; }
  if (req.query.mine === 'host') filter.user_id = req.user._id;
  else if (req.query.mine === 'joined') filter['participants.user_id'] = req.user._id;
  else if (req.query.mine === 'requested') filter.join_requests = { $elemMatch: { user_id: req.user._id, status: 'pending' } };
  if (['fixed','flexible'].includes(req.query.mode)) filter.mode = req.query.mode;
  const posts = await Post.find(filter).sort({start_datetime:1}).limit(100);
  res.json(posts.map(post => service.publicParty(post,req.user._id)));
});
router.get('/party-search', async (req, res) => {
  const query = partySearchQuery(req.query);
  // Aggregate preserves the position/capacity expressions without Mongoose query casting.
  const [result] = await Post.aggregate([
    { $match: query.filter },
    { $facet: {
      items: [{ $sort: query.sort }, { $skip: (query.page - 1) * query.pageSize }, { $limit: query.pageSize }],
      total: [{ $count: 'count' }],
    } },
  ]);
  // Older records may predate these arrays; aggregation does not apply schema defaults.
  const posts = (result?.items || []).map(post => ({ ...post, participants: post.participants || [], required_positions: post.required_positions || [], join_requests: post.join_requests || [] }));
  res.json({ total: result?.total?.[0]?.count || 0, page: query.page, pageSize: query.pageSize, parties: posts.map(post => service.publicParty(post, req.user._id)) });
});
router.post('/parties', async (req,res) => { const post = await service.createParty(req.user._id,req.body.field_id,req.body); res.status(201).json(service.publicParty(post,req.user._id)); });
router.get('/parties/:id/messages', async (req, res) => res.json(await chat.readChat(req.params.id, req.user._id, req.query.before)));
router.post('/parties/:id/messages', async (req, res) => res.status(201).json(await chat.sendChat(req.params.id, req.user, req.body)));
router.patch('/parties/:id/messages/read', async (req, res) => res.json(await chat.acknowledgeChat(req.params.id, req.user._id, req.body?.message_id)));
router.get('/parties/:id', async (req,res) => { const through = new Date(); service.objectId(req.params.id); const post=await Post.findById(req.params.id); if(!post)service.fail(404,'ไม่พบปาร์ตี้'); res.json({ ...service.publicParty(post,req.user._id), activity_read_through: through }); });
router.patch('/parties/:id', async(req,res) => res.json(service.publicParty(await service.updateParty(req.params.id,req.user._id,req.body),req.user._id)));
router.post('/parties/:id/cancel', async(req,res) => res.json(service.publicParty(await service.cancelParty(req.params.id,req.user._id,req.body?.reason),req.user._id)));
router.post('/parties/:id/join', async(req,res) => res.json(service.publicParty(await service.joinParty(req.params.id,req.user._id,req.body.position),req.user._id)));
router.post('/parties/:id/leave', async(req,res) => res.json(service.publicParty(await service.leaveParty(req.params.id,req.user._id),req.user._id)));
router.get('/parties/:id/requests', async(req,res) => { service.objectId(req.params.id); const post=await Post.findById(req.params.id); if(!post)service.fail(404,'ไม่พบปาร์ตี้');service.hostOnly(post,req.user._id);res.json(service.publicParty(post,req.user._id)); });
router.patch('/parties/:id/requests/:requestId', async(req,res) => res.json(service.publicParty(await service.reviewRequest(req.params.id,req.params.requestId,req.user._id,req.body.decision),req.user._id)));
module.exports = router;
