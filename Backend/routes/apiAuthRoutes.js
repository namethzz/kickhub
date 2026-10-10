const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
router.post('/', async(req,res) => {
  const {email,password} = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({message:'กรุณากรอกอีเมลและรหัสผ่าน'});
  const user=await User.findOne({email:email.trim().toLowerCase()});
  if (!user || user.status === 'banned' || !await bcrypt.compare(password,user.password)) return res.status(401).json({message:'อีเมลหรือรหัสผ่านไม่ถูกต้อง'});
  const token=jwt.sign({_id:user._id},process.env.SECRET_KEY,{expiresIn:'24h'});
  res.json({status:'ok',token});
});
module.exports = router;
