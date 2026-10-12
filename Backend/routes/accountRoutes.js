const express = require('express');
const mongoose = require('mongoose');
const authenticate = require('../middleware/authMiddleware');
const { eraseAccount } = require('../services/accountDeletionService');
const router = express.Router();
router.delete('/', authenticate, async (req, res) => {
  if (req.body?.confirmation !== 'ลบบัญชี') return res.status(400).json({ message: 'กรุณาพิมพ์ ลบบัญชี เพื่อยืนยัน' });
  const age = Date.now() / 1000 - req.authIssuedAt;
  if (!Number.isFinite(age) || age < -60 || age > 600) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบใหม่ก่อนลบบัญชี (ภายใน 10 นาที)' });
  await mongoose.connection.transaction(session => eraseAccount(req.user._id, session));
  res.set('Cache-Control', 'no-store').json({ status: 'deleted' });
});
module.exports = router;
