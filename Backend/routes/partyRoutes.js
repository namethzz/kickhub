const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Post = require('../models/Post');
const Field = require('../models/Field');
const service = require('../services/partyService');
const { myPartyQuery } = require('../services/myPartiesService');
const { partyCard } = require('../services/discoveryService');
const publicProfile = user => ({ _id: user._id, name: user.name, bio: user.bio, area: user.area, preferred_position: user.preferred_position, level: user.level, role: user.role });
router.get('/discover', async (req, res) => {
  const [fields, parties] = await Promise.all([
    Field.find({ is_active: true }).select('field_name field_type address price image open close facilities').sort({ createdAt: -1 }),
    Post.find({ start_datetime: { $gt: new Date() } }).select('party_name mode access field_id field_name address start_datetime end_datetime price required_positions total_required_players participants').sort({ start_datetime: 1 }).limit(100),
  ]);
  res.json({ fields, parties: parties.map(partyCard) });
});
router.get('/profiles/:id', async (req, res) => {
  service.objectId(req.params.id);
  const user = await User.findOne({ _id: req.params.id, status: 'active' });
  if (!user) service.fail(404, 'ไม่พบโปรไฟล์');
  res.json(publicProfile(user));
});
router.use(auth);
router.get('/me', (req,res) => res.json({ ...publicProfile(req.user), email: req.user.email }));
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
  res.json({ ...publicProfile(user), email: user.email });
});
router.get('/fields', async (req,res) => res.json(await Field.find({is_active:true}).select('field_name field_type address price image open close facilities').sort({createdAt:-1})));
router.get('/fields/:id', async (req,res) => {
  service.objectId(req.params.id);
  const field = await Field.findOne({_id:req.params.id,is_active:true}).select('field_name field_type address price image open close facilities description google_map mobile_number owner_id');
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
  const filter = { end_datetime: { $gt: new Date() } };
  if (req.query.field) { service.objectId(req.query.field); filter.field_id = req.query.field; }
  if (req.query.mine === 'host') filter.user_id = req.user._id;
  else if (req.query.mine === 'joined') filter['participants.user_id'] = req.user._id;
  else if (req.query.mine === 'requested') filter.join_requests = { $elemMatch: { user_id: req.user._id, status: 'pending' } };
  if (['fixed','flexible'].includes(req.query.mode)) filter.mode = req.query.mode;
  const posts = await Post.find(filter).sort({start_datetime:1}).limit(100);
  res.json(posts.map(post => service.publicParty(post,req.user._id)));
});
router.post('/parties', async (req,res) => { const post = await service.createParty(req.user._id,req.body.field_id,req.body); res.status(201).json(service.publicParty(post,req.user._id)); });
router.get('/parties/:id', async (req,res) => { service.objectId(req.params.id); const post=await Post.findById(req.params.id); if(!post)service.fail(404,'ไม่พบปาร์ตี้'); res.json(service.publicParty(post,req.user._id)); });
router.post('/parties/:id/join', async(req,res) => res.json(service.publicParty(await service.joinParty(req.params.id,req.user._id,req.body.position),req.user._id)));
router.post('/parties/:id/leave', async(req,res) => res.json(service.publicParty(await service.leaveParty(req.params.id,req.user._id),req.user._id)));
router.get('/parties/:id/requests', async(req,res) => { service.objectId(req.params.id); const post=await Post.findById(req.params.id); if(!post)service.fail(404,'ไม่พบปาร์ตี้');service.hostOnly(post,req.user._id);res.json(service.publicParty(post,req.user._id)); });
router.patch('/parties/:id/requests/:requestId', async(req,res) => res.json(service.publicParty(await service.reviewRequest(req.params.id,req.params.requestId,req.user._id,req.body.decision),req.user._id)));
module.exports = router;
