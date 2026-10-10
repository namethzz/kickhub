const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
async function authenticateToken(req, res, next) {
  const match = /^Bearer (.+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
  try {
    const claims = jwt.verify(match[1], process.env.SECRET_KEY);
    const id = claims._id || claims.id;
    if (!mongoose.isObjectIdOrHexString(id)) return res.status(401).json({ message: 'บัญชีไม่ถูกต้อง' });
    const user = await User.findById(id).select('-password');
    if (!user || user.status === 'banned') return res.status(401).json({ message: 'บัญชีไม่สามารถใช้งานได้' });
    req.user = user; next();
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบใหม่' });
    next(error);
  }
}
module.exports = authenticateToken;
