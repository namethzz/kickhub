const Post = require('../models/Post');
const PartyImage = require('../models/PartyImage');
const { fail, objectId, hostOnly, coverUrl } = require('./partyService');
const { sniffType } = require('./profileImageService');

// Mirrors the client cap in frontend/src/lib/profile-image.ts (party cover: 2 MB after resizing).
const MAX_BYTES = 2 * 1024 * 1024;

// Only the host may set the cover, and only while the party can still be edited.
async function editableParty(postId, actor) {
  objectId(postId);
  const post = await Post.findById(postId).select('user_id status start_datetime');
  if (!post) fail(404, 'ไม่พบปาร์ตี้');
  hostOnly(post, actor);
  if (post.status === 'cancelled') fail(409, 'ปาร์ตี้นี้ถูกยกเลิกแล้ว');
  if (post.start_datetime <= new Date()) fail(409, 'ปาร์ตี้เริ่มแล้ว ไม่สามารถเปลี่ยนรูปได้');
  return post;
}

// Trust the file's bytes, never the declared Content-Type or file name.
async function saveCover(postId, actor, buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) fail(400, 'ไม่พบไฟล์รูปภาพ กรุณาเลือกไฟล์ JPG, PNG หรือ WebP');
  if (buffer.length > MAX_BYTES) fail(413, 'ไฟล์รูปใหญ่เกินไป');
  const type = sniffType(buffer);
  if (!type) fail(415, 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP');
  await editableParty(postId, actor);
  await PartyImage.updateOne({ post_id: postId }, { $set: { content_type: type, data: buffer } }, { upsert: true });
  const updatedAt = new Date();
  // updateOne keeps this off the party's optimistic-concurrency path, so a cover change never conflicts with joins.
  await Post.updateOne({ _id: postId }, { $set: { image_updated_at: updatedAt } });
  return { cover_url: coverUrl({ _id: postId, image_updated_at: updatedAt }) };
}

async function removeCover(postId, actor) {
  await editableParty(postId, actor);
  await PartyImage.deleteOne({ post_id: postId });
  await Post.updateOne({ _id: postId }, { $unset: { image_updated_at: '' } });
  return { cover_url: '' };
}

async function readCover(postId) {
  objectId(postId);
  const image = await PartyImage.findOne({ post_id: postId });
  if (!image) fail(404, 'ไม่พบรูป');
  return { contentType: image.content_type, data: Buffer.from(image.data), updatedAt: image.updatedAt };
}

module.exports = { MAX_BYTES, saveCover, removeCover, readCover };
