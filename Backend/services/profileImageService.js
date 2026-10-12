const User = require('../models/User');
const ProfileImage = require('../models/ProfileImage');

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const KINDS = {
  avatar: { max: 1024 * 1024, field: 'avatar_updated_at' },
  cover: { max: 2 * 1024 * 1024, field: 'cover_updated_at' },
};
const PROVIDER_NAMES = { google: 'Google', facebook: 'Facebook' };
// Only provider CDNs may be fetched server-side, so a forged URL can never reach internal hosts (SSRF).
const PROVIDER_HOSTS = {
  google: host => /^lh\d+\.googleusercontent\.com$/.test(host),
  facebook: host => /(^|\.)fbcdn\.net$/.test(host) || host === 'platform-lookaside.fbsbx.com' || host === 'graph.facebook.com',
};

// Trust the file's bytes, never the declared Content-Type or file name.
function sniffType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return '';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return '';
}

function socialPhotoUrl(provider, raw) {
  if (!PROVIDER_HOSTS[provider] || typeof raw !== 'string' || !raw || raw.length > 2048) return '';
  let url;
  try { url = new URL(raw); } catch { return ''; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !PROVIDER_HOSTS[provider](url.hostname)) return '';
  // Google serves a 96px thumbnail by default; ask for a sharper one.
  return provider === 'google' ? url.href.replace(/=s\d+(-c)?$/, '=s512-c') : url.href;
}

async function fetchRemoteImage(url, max, fetcher = fetch) {
  let response;
  try { response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(8000), headers: { Accept: 'image/jpeg,image/png,image/webp' } }); }
  catch { fail(502, 'ดึงรูปจากบริการไม่สำเร็จ กรุณาลองอีกครั้ง'); }
  if (!response.ok) fail(502, 'ดึงรูปจากบริการไม่สำเร็จ รูปอาจหมดอายุ กรุณาเข้าสู่ระบบด้วยบริการนั้นอีกครั้ง');
  const declared = Number(response.headers?.get?.('content-length'));
  if (declared > max) fail(413, 'รูปจากบริการใหญ่เกินไป');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > max) fail(413, 'รูปจากบริการใหญ่เกินไป');
  return buffer;
}

function imageUrl(user, kind) {
  const at = user[KINDS[kind].field];
  return at ? `/api/v2/profiles/${user._id}/${kind}?v=${new Date(at).getTime()}` : '';
}

async function saveImage(userId, kind, buffer, source = 'upload') {
  const spec = KINDS[kind];
  if (!spec) fail(400, 'ประเภทรูปไม่ถูกต้อง');
  if (!Buffer.isBuffer(buffer) || !buffer.length) fail(400, 'ไม่พบไฟล์รูปภาพ กรุณาเลือกไฟล์ JPG, PNG หรือ WebP');
  if (buffer.length > spec.max) fail(413, 'ไฟล์รูปใหญ่เกินไป');
  const type = sniffType(buffer);
  if (!type) fail(415, 'รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP');
  const user = await User.findById(userId).select('_id');
  if (!user) fail(404, 'ไม่พบบัญชีนี้');
  await ProfileImage.updateOne({ user_id: userId, kind }, { $set: { content_type: type, data: buffer } }, { upsert: true });
  const set = { [spec.field]: new Date() };
  if (kind === 'avatar') set.avatar_source = source;
  return User.findByIdAndUpdate(userId, { $set: set }, { new: true });
}

async function removeImage(userId, kind) {
  const spec = KINDS[kind];
  if (!spec) fail(400, 'ประเภทรูปไม่ถูกต้อง');
  await ProfileImage.deleteOne({ user_id: userId, kind });
  // "none" records an explicit removal so a later social login does not silently bring the photo back.
  const update = kind === 'avatar' ? { $unset: { [spec.field]: '' }, $set: { avatar_source: 'none' } } : { $unset: { [spec.field]: '' } };
  return User.findByIdAndUpdate(userId, update, { new: true });
}

async function readImage(userId, kind) {
  if (!KINDS[kind]) fail(404, 'ไม่พบรูป');
  const user = await User.findOne({ _id: userId, status: 'active' }).select('_id');
  const image = user && await ProfileImage.findOne({ user_id: userId, kind });
  if (!image) fail(404, 'ไม่พบรูป');
  return { contentType: image.content_type, data: Buffer.from(image.data), updatedAt: image.updatedAt };
}

async function importSocialPhoto(userId, provider, fetcher = fetch) {
  if (!PROVIDER_HOSTS[provider]) fail(400, 'วิธีเข้าสู่ระบบไม่ถูกต้อง');
  const user = await User.findById(userId).select('social_photos');
  if (!user) fail(404, 'ไม่พบบัญชีนี้');
  const url = socialPhotoUrl(provider, user.social_photos?.[provider]);
  if (!url) fail(404, `ยังไม่มีรูปจาก ${PROVIDER_NAMES[provider]} กรุณาเข้าสู่ระบบด้วย ${PROVIDER_NAMES[provider]} อีกครั้ง`);
  const buffer = await fetchRemoteImage(url, KINDS.avatar.max, fetcher);
  return saveImage(userId, 'avatar', buffer, provider);
}

// Called after a verified social login. Photo problems must never block signing in.
async function rememberSocialPhoto(user, provider, rawUrl, fetcher = fetch) {
  const url = socialPhotoUrl(provider, rawUrl);
  if (!url || !user?._id) return;
  try {
    const before = await User.findByIdAndUpdate(user._id, { $set: { [`social_photos.${provider}`]: url } }, { new: false }).select('avatar_source');
    if (before && !before.avatar_source) await importSocialPhoto(user._id, provider, fetcher);
  } catch { /* best effort */ }
}

module.exports = { KINDS, sniffType, socialPhotoUrl, fetchRemoteImage, imageUrl, saveImage, removeImage, readImage, importSocialPhoto, rememberSocialPhoto };
