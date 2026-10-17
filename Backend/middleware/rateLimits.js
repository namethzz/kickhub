const { rateLimit } = require('express-rate-limit');
const limiter = (limit, message, options = {}) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false, message: { message }, ...options });
// Only failed attempts count, so a player who types the right password is never locked out by earlier logins.
// The limit is per IP and players often share campus or mobile-carrier IPs, so it stays generous.
const loginLimiter = limiter(20, 'ลองเข้าสู่ระบบผิดหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่', { skipSuccessfulRequests: true });
// The login page reads the provider /config on every visit; only the POSTs that create accounts or sessions count.
const authLimiter = limiter(30, 'มีคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่', { skip: req => req.method !== 'POST' });
module.exports = { loginLimiter, authLimiter };
