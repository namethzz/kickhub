const {test}=require('node:test');
const assert=require('node:assert/strict');
const jwt=require('jsonwebtoken');
const User=require('../models/User');
const {socialLogin,completeSocialSignup}=require('../services/socialSignupService');
process.env.SECRET_KEY='isolated-social-signup-proof-test-secret';
const profiles={google:{sub:'google-new',email:'new@example.test',name:'New player'},facebook:{id:'facebook-new',email:'new@example.test',name:'New player'}};
for(const provider of ['google','facebook']){
 test(provider+' first-time login does not create an account until a role is confirmed',async context=>{
  context.mock.method(User,'findOne',async()=>null);context.mock.method(User,'exists',async()=>null);
  const create=context.mock.method(User,'create',async data=>({_id:'507f1f77bcf86cd799439011',...data}));
  const pending=await socialLogin(provider,profiles[provider],undefined,true);
  assert.equal(pending.status,'role_required');assert.equal(create.mock.callCount(),0);
  const proof=jwt.verify(pending.signupToken,process.env.SECRET_KEY,{audience:'kickhub-signup',issuer:'kickhub'});assert.equal(proof._id,undefined);assert.equal(proof.exp-proof.iat,300);
  const completed=await completeSocialSignup(pending.signupToken,'owner',true);
  assert.equal(completed.status,'ok');assert.equal(completed.role,'owner');assert.equal(create.mock.callCount(),1);assert.equal(create.mock.calls[0].arguments[0].role,'owner');
  const session=jwt.verify(completed.token,process.env.SECRET_KEY);assert.equal(session.exp-session.iat,604800);
 });
 test(provider+' returning login and replayed role choice retain the stored role',async context=>{
  const user={_id:'507f1f77bcf86cd799439011',role:'user',status:'active'};
  context.mock.method(User,'findOne',async()=>user);const create=context.mock.method(User,'create',async()=>{throw Error('Should not create')});
  assert.equal((await socialLogin(provider,profiles[provider],undefined,false)).role,'user');
  const proof=jwt.sign({purpose:'social-signup',provider,profile:profiles[provider]},process.env.SECRET_KEY,{expiresIn:300,issuer:'kickhub',audience:'kickhub-signup'});
  assert.equal((await completeSocialSignup(proof,'owner',false)).role,'user');assert.equal(create.mock.callCount(),0);assert.equal(user.role,'user');
 });
}
test('signup rejects collisions, invalid roles, tampered/expired proofs, and ordinary auth tokens',async context=>{
 context.mock.method(User,'findOne',async()=>null);context.mock.method(User,'exists',async()=>({_id:'another-user'}));
 await assert.rejects(socialLogin('google',profiles.google),e=>e.status===409);
 await assert.rejects(completeSocialSignup('anything','admin',false),e=>e.status===400);
 await assert.rejects(completeSocialSignup('tampered','owner',false),e=>e.status===401);
 const expired=jwt.sign({purpose:'social-signup',provider:'google',profile:profiles.google},process.env.SECRET_KEY,{expiresIn:-1,issuer:'kickhub',audience:'kickhub-signup'});
 await assert.rejects(completeSocialSignup(expired,'owner',false),e=>e.status===401);
 const login=jwt.sign({_id:'507f1f77bcf86cd799439011'},process.env.SECRET_KEY,{expiresIn:3600});
 await assert.rejects(completeSocialSignup(login,'user',false),e=>e.status===401);
});
test('signup proof cannot authenticate protected routes and completion ignores spoofed profile data',async context=>{
 context.mock.method(User,'findOne',async()=>null);context.mock.method(User,'exists',async()=>null);
 const create=context.mock.method(User,'create',async data=>({_id:'507f1f77bcf86cd799439011',...data}));
 const pending=await socialLogin('google',profiles.google,undefined,false);
 const app=require('../app');const server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  assert.equal((await fetch(base+'/api/v2/me',{headers:{Authorization:'Bearer '+pending.signupToken}})).status,401);assert.equal(create.mock.callCount(),0);
  const result=await fetch(base+'/api/auth/social/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({signupToken:pending.signupToken,role:'user',profile:{email:'other@example.test',sub:'other-google'}})});
  assert.equal(result.status,200);assert.equal(create.mock.calls[0].arguments[0].email,'new@example.test');assert.equal(create.mock.calls[0].arguments[0].google_id,'google-new');
 }finally{await new Promise(resolve=>server.close(resolve));}
});
