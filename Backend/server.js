require('dotenv').config();
const app=require('./app');
const connect=require('./database');
async function start(){
  if(!process.env.SECRET_KEY)throw new Error('Set SECRET_KEY before starting the API');
  if(process.env.NODE_ENV==='production'){
    if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI before starting the production API');
    if(process.env.SECRET_KEY.length<32 || process.env.SECRET_KEY==='replace-with-a-long-random-secret')throw new Error('SECRET_KEY must be a random secret of at least 32 characters');
    const origins=(process.env.CLIENT_ORIGIN||'').split(',').map(value=>value.trim()).filter(Boolean);
    if(!origins.length || origins.some(value=>{try{const url=new URL(value);return url.protocol!=='https:' || url.origin!==value;}catch{return true;}}))throw new Error('CLIENT_ORIGIN must contain exact HTTPS origins separated by commas');
  }
  await connect();
  app.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('KickHub API ready'));
}
start().catch(error=>{console.error('API startup failed:',error.message);process.exitCode=1;});
