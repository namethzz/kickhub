const router=require('express').Router();
const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
router.post('/',async(req,res)=>{
  const {name,email,password,role='user'}=req.body;
  if(typeof name!=='string'||!name.trim()||name.length>100||typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<8||password.length>128||!['owner','user'].includes(role))return res.status(400).json({message:'กรุณากรอกข้อมูลให้ครบ และใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร'});
  try{const user=await User.create({name:name.trim(),email:email.trim().toLowerCase(),password:await bcrypt.hash(password,10),role});res.status(201).json({status:'ok',token:jwt.sign({_id:user._id},process.env.SECRET_KEY,{expiresIn:'24h'})});}catch(error){if(error.code===11000)return res.status(409).json({message:'อีเมลนี้มีบัญชีแล้ว'});throw error;}
});
module.exports=router;
