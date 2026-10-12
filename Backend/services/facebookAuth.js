const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function configuration() {
  const appId = process.env.FACEBOOK_APP_ID || '';
  const appSecret = process.env.FACEBOOK_APP_SECRET || '';
  const version = process.env.FACEBOOK_GRAPH_VERSION || 'v25.0';
  return { appId, appSecret, version, enabled: /^\d+$/.test(appId) && !!appSecret && /^v\d+\.\d+$/.test(version) };
}
async function verifyFacebookToken(token, fetcher = fetch) {
  const config = configuration();
  if (!config.enabled) fail(503, 'Facebook Login ยังไม่เปิดใช้งาน กรุณาใช้อีเมลก่อน');
  if (typeof token !== 'string' || !token || token.length > 4096) fail(400, 'ข้อมูล Facebook Login ไม่ถูกต้อง');
  const base = `https://graph.facebook.com/${config.version}`;
  async function request(url, bearer) {
    let response;
    try { response = await fetcher(url, { headers: { Authorization: `Bearer ${bearer}` }, signal: AbortSignal.timeout(10000) }); }
    catch { fail(502, 'ติดต่อ Facebook ไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) fail(401, 'ยืนยันบัญชี Facebook ไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่');
    return result;
  }
  const { data } = await request(`${base}/debug_token?input_token=${encodeURIComponent(token)}`, `${config.appId}|${config.appSecret}`);
  const now = Date.now() / 1000;
  if (!data?.is_valid || String(data.app_id) !== config.appId || data.type !== 'USER' || !data.user_id || (data.expires_at && data.expires_at <= now) || (data.data_access_expires_at && data.data_access_expires_at <= now)) fail(401, 'Facebook token หมดอายุหรือไม่ใช่ของแอปนี้');
  const proof = crypto.createHmac('sha256', config.appSecret).update(token).digest('hex');
  const fields = encodeURIComponent('id,name,email,picture.width(512).height(512){url,is_silhouette}');
  const profile = await request(`${base}/me?fields=${fields}&appsecret_proof=${proof}`, token);
  if (String(profile.id) !== String(data.user_id) || typeof profile.name !== 'string') fail(401, 'ข้อมูลบัญชี Facebook ไม่ถูกต้อง');
  // Flatten Graph's nested picture; Facebook's default silhouette is not a real photo, so ignore it.
  const picture = profile.picture?.data;
  return { ...profile, picture: picture && !picture.is_silhouette && typeof picture.url === 'string' ? picture.url : undefined };
}
async function facebookAccount(profile, role = 'user') {
  if (!['user', 'owner'].includes(role)) fail(400, 'ประเภทบัญชีไม่ถูกต้อง');
  const existing = await User.findOne({ facebook_id: profile.id });
  if (existing) {
    if (existing.status !== 'active') fail(403, 'บัญชีนี้ไม่สามารถเข้าสู่ระบบได้');
    return existing;
  }
  if (typeof profile.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) fail(400, 'Facebook ไม่ได้ส่งอีเมล กรุณาอนุญาตการแชร์อีเมล หรือสมัครด้วยอีเมล');
  const email = profile.email.trim().toLowerCase();
  // Never attach a social identity to an existing password account by email alone.
  if (await User.exists({ email })) fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเดิม');
  try {
    return await User.create({ name: profile.name.slice(0, 100), email, facebook_id: profile.id, password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), role });
  } catch (error) {
    if (error.code === 11000) {
      const concurrent = await User.findOne({ facebook_id: profile.id, status: 'active' });
      if (concurrent) return concurrent;
      fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเดิม');
    }
    throw error;
  }
}
module.exports = { configuration, verifyFacebookToken, facebookAccount };
