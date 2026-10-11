const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const client = new OAuth2Client();
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function configuration() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  return { clientId, enabled: /^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId) };
}
async function verifyGoogleToken(credential, verifier = client) {
  const { clientId, enabled } = configuration();
  if (!enabled) fail(503, 'Google Login ยังไม่เปิดใช้งาน กรุณาใช้อีเมลก่อน');
  if (typeof credential !== 'string' || !credential || credential.length > 16384) fail(400, 'ข้อมูล Google Login ไม่ถูกต้อง');
  let payload;
  try {
    const ticket = await verifier.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch { fail(401, 'ยืนยันบัญชี Google ไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่'); }
  // The library verifies the signature. Also enforce the exact claims used by this app.
  if (!payload || payload.aud !== clientId || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss) || !(payload.exp > Date.now() / 1000) || typeof payload.sub !== 'string' || !payload.sub || payload.email_verified !== true || typeof payload.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) fail(401, 'ข้อมูลบัญชี Google ไม่ถูกต้องหรืออีเมลยังไม่ยืนยัน');
  return payload;
}
async function googleAccount(profile, role = 'user') {
  if (!['user', 'owner'].includes(role)) fail(400, 'ประเภทบัญชีไม่ถูกต้อง');
  const existing = await User.findOne({ google_id: profile.sub });
  if (existing) {
    if (existing.status !== 'active') fail(403, 'บัญชีนี้ไม่สามารถเข้าสู่ระบบได้');
    return existing;
  }
  const email = profile.email.trim().toLowerCase();
  // Email alone never authorizes linking to a password or Facebook account.
  if (await User.exists({ email })) fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยวิธีที่ใช้สมัครเดิม');
  try {
    return await User.create({ google_id: profile.sub, email, name: (typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : email.split('@')[0]).slice(0, 100), password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10), role });
  } catch (error) {
    if (error.code === 11000) {
      const concurrent = await User.findOne({ google_id: profile.sub, status: 'active' });
      if (concurrent) return concurrent;
      fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยวิธีที่ใช้สมัครเดิม');
    }
    throw error;
  }
}
module.exports = { configuration, verifyGoogleToken, googleAccount };
