const User = require('../models/User');
const Field = require('../models/Field');
const Post = require('../models/Post');
const Reservation = require('../models/Reservation');
const ProfileImage = require('../models/ProfileImage');

async function eraseAccount(userId, session) {
  const options = { session };
  const user = await User.findById(userId).session(session);
  if (!user) throw Object.assign(new Error('ไม่พบบัญชีนี้'), { status: 404 });
  const hostedIds = await Post.find({ user_id: user._id }).distinct('_id').session(session);
  // Preserve the remaining players' reservation history, but cancel removed parties.
  await Reservation.updateMany({ post_id: { $in: hostedIds }, user_id: { $ne: user._id } }, {
    $set: { status: 'cancelled' }, $unset: { post_id: '' },
  }, options);
  await Reservation.deleteMany({ user_id: user._id }, options);
  await Post.deleteMany({ user_id: user._id }, options);
  await Post.updateMany({ $or: [
    { 'participants.user_id': user._id }, { 'join_requests.user_id': user._id },
    { 'chat_messages.sender_id': user._id }, { 'notification_events.recipient_id': user._id },
  ] }, {
    $pull: {
      participants: { user_id: user._id },
      join_requests: { user_id: user._id },
      chat_messages: { sender_id: user._id },
      notification_events: { recipient_id: user._id },
    },
    $inc: { __v: 1 },
  }, options);
  // Older notifications store an actor name rather than actor ID. Remove that label.
  await Post.updateMany({ 'notification_events.actor_name': user.name }, {
    $set: { 'notification_events.$[event].actor_name': 'ผู้ใช้ที่ลบบัญชี' },
    $inc: { __v: 1 },
  }, { ...options, arrayFilters: [{ 'event.actor_name': user.name }] });
  await Field.updateMany({ owner_id: user._id }, {
    $set: { owner_id: null, is_active: false, mobile_number: '', description: '', image: '' },
  }, options);
  await ProfileImage.deleteMany({ user_id: user._id }, options);
  await User.deleteOne({ _id: user._id }, options);
}
module.exports = { eraseAccount };
