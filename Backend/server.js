require('dotenv').config();
const app=require('./app');
const connect=require('./database');
async function start(){if(!process.env.SECRET_KEY)throw new Error('Set SECRET_KEY before starting the API');await connect();app.listen(process.env.PORT||3000,()=>console.log('KickHub API ready'));}
start().catch(error=>{console.error('API startup failed:',error.message);process.exitCode=1;});
