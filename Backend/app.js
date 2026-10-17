require('dotenv').config();
const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');
const { loginLimiter, authLimiter }=require('./middleware/rateLimits');
const app=express();
// Behind a hosting proxy (Render), set TRUST_PROXY to its hop count so rate limits see the real client IP.
const proxyHops=Number(process.env.TRUST_PROXY);
if(Number.isInteger(proxyHops) && proxyHops>0)app.set('trust proxy',proxyHops);
const origins=(process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(value=>value.trim()).filter(Boolean);
app.use(cors({origin:origins}));
app.get('/api/health', (req,res)=>{
  const ready=mongoose.connection.readyState===1;
  res.set('Cache-Control','no-store').status(ready?200:503).json({status:ready?'ok':'unavailable'});
});
app.use(express.json({limit:'1mb'}));
app.use('/api/auth/login',loginLimiter,require('./routes/apiAuthRoutes'));
app.use('/api/auth/register',authLimiter,require('./routes/apiRegister'));
app.use('/api/auth/google',authLimiter,require('./routes/googleAuth'));
app.use('/api/auth/social',authLimiter,require('./routes/socialSignup'));
app.use('/api/auth/facebook',authLimiter,require('./routes/facebookAuth'));
app.use('/api/account',require('./routes/accountRoutes'));
app.use('/api/v2',require('./routes/partyRoutes'));
app.use('/api',require('./routes/apiPrivateRoutes'));
app.use((error,req,res,next)=>{const status=error.status||(['ValidationError','CastError'].includes(error.name)?400:500);res.status(status).json({message:status===500?'ระบบไม่พร้อมใช้งาน กรุณาลองใหม่':error.message});});
module.exports=app;
