const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { googleAccount } = require('./googleAuth');
const { facebookAccount } = require('./facebookAuth');
const { rememberSocialPhoto, socialPhotoUrl } = require('./profileImageService');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const creators = { google: googleAccount, facebook: facebookAccount };
function sessionResult(user, rememberMe) {
  return { status: 'ok', role: user.role, token: jwt.sign({ _id: user._id }, process.env.SECRET_KEY, { expiresIn: rememberMe === true ? '7d' : '24h' }) };
}
// Sign in, then (best effort) remember the provider's profile photo for this user.
async function finishLogin(provider, user, profile, rememberMe) {
  await rememberSocialPhoto(user, provider, profile.picture);
  return sessionResult(user, rememberMe);
}
async function socialLogin(provider, profile, role, rememberMe) {
  const create = creators[provider];
  if (!['google', 'facebook'].includes(provider)) fail(400, 'วิธีเข้าสู่ระบบไม่ถูกต้อง');
  if (role !== undefined) return finishLogin(provider, await create(profile, role), profile, rememberMe);
  const identity = provider === 'google' ? { google_id: profile.sub } : { facebook_id: profile.id };
  if (await User.findOne(identity)) return finishLogin(provider, await create(profile), profile, rememberMe);
  const email = typeof profile.email === 'string' ? profile.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'บริการไม่ได้ส่งอีเมล กรุณาอนุญาตการแชร์อีเมล หรือสมัครด้วยอีเมล');
  if (await User.exists({ email })) fail(409, 'อีเมลนี้มีบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยวิธีที่ใช้สมัครเดิม');
  const picture = socialPhotoUrl(provider, profile.picture);
  const verifiedProfile = { email, name: (typeof profile.name === 'string' && profile.name.trim() ? profile.name.trim() : email.split('@')[0]).slice(0, 100), ...(provider === 'google' ? { sub: profile.sub } : { id: profile.id }), ...(picture ? { picture } : {}) };
  return {
    status: 'role_required', name: verifiedProfile.name,
    signupToken: jwt.sign({ purpose: 'social-signup', provider, profile: verifiedProfile }, process.env.SECRET_KEY, { expiresIn: '5m', issuer: 'kickhub', audience: 'kickhub-signup' }),
  };
}
async function completeSocialSignup(signupToken, role, rememberMe) {
  if (!['user', 'owner'].includes(role)) fail(400, 'กรุณาเลือกผู้เล่นหรือเจ้าของสนาม');
  if (typeof signupToken !== 'string' || signupToken.length > 8192) fail(400, 'ข้อมูลสมัครสมาชิกไม่ถูกต้อง');
  let claims;
  try { claims = jwt.verify(signupToken, process.env.SECRET_KEY, { issuer: 'kickhub', audience: 'kickhub-signup' }); }
  catch { fail(401, 'ข้อมูลสมัครสมาชิกหมดอายุ กรุณาเข้าสู่ระบบด้วย Google หรือ Facebook อีกครั้ง'); }
  if (claims.purpose !== 'social-signup' || !['google', 'facebook'].includes(claims.provider) || !claims.profile) fail(401, 'ข้อมูลสมัครสมาชิกไม่ถูกต้อง');
  return finishLogin(claims.provider, await creators[claims.provider](claims.profile, role), claims.profile, rememberMe);
}
module.exports = { socialLogin, completeSocialSignup };
