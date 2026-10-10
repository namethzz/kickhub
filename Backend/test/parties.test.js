const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
process.env.SECRET_KEY = 'isolated-test-secret-do-not-use-in-production';
const app = require('../app');
const User = require('../models/User');
const Field = require('../models/Field');
const Post = require('../models/Post');
let mongo,server,url,host,first,second,hostToken,firstToken,secondToken,field;
async function call(path,token,method='GET',body){const response=await fetch(url+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
function payload(overrides={}){const start=Date.now()+86400000;return {field_id:String(field._id),party_name:'Integration party',mode:'fixed',access:'approval',start_datetime:new Date(start).toISOString(),end_datetime:new Date(start+3600000).toISOString(),price:100,required_positions:[{position:'GK',amount:1},{position:'DF',amount:1},{position:'MF',amount:0},{position:'FW',amount:0}],position:'DF',...overrides};}
before(async()=>{
 const uri=process.env.TEST_MONGODB_URI;
 if(uri){if(!/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/kickhub_test(?:\?|$)/.test(uri))throw new Error('Integration tests require a local isolated kickhub_test database');await mongoose.connect(uri);await mongoose.connection.dropDatabase();}
 else {mongo=await MongoMemoryServer.create({binary:{version:'7.0.24'}});await mongoose.connect(mongo.getUri());}
 server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));url=`http://127.0.0.1:${server.address().port}`;
 async function signup(name,role='user'){const result=await call('/register',null,'POST',{name,email:`${name}@example.test`,password:'password123',role});assert.equal(result.status,201);return {user:await User.findOne({name}),token:result.data.token};}
 ({user:host,token:hostToken}=await signup('Host','owner'));({user:first,token:firstToken}=await signup('First'));({user:second,token:secondToken}=await signup('Second'));
 field=await Field.create({owner_id:host._id,field_name:'Test field',field_type:'7v7',mobile_number:'0000000000',address:'Bangkok',price:1200,open:'09:00',close:'23:00',google_map:'https://maps.google.com/'});
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(mongoose.connection.readyState===1)await mongoose.connection.dropDatabase();await mongoose.disconnect();if(mongo)await mongo.stop();});
test('profile privacy, authenticated editing and normalized auth tokens',async()=>{
 assert.equal((await call('/api/v2/me',null)).status,401);
 const login=await call('/login',null,'POST',{email:'FIRST@example.test',password:'password123'});assert.equal(login.status,200);
 const updated=await call('/api/v2/me',firstToken,'PATCH',{name:'Player one',bio:'Goalkeeper',preferred_position:'GK',role:'owner',password:'changed',email:'attack@example.test'});assert.equal(updated.status,200);assert.equal(updated.data.role,'user');assert.equal(updated.data.email,'first@example.test');
 const profile=await call(`/api/v2/profiles/${first._id}`,null);assert.equal(profile.status,200);assert.equal(profile.data.bio,'Goalkeeper');for(const key of ['email','password','last_login'])assert.equal(profile.data[key],undefined);
 const legacy=jwt.sign({id:first._id},process.env.SECRET_KEY);assert.equal((await call('/api/v2/me',legacy)).status,200);
 const oldUsers=await call('/api/user',firstToken);assert.equal(oldUsers.data.users.length,1);assert.equal(oldUsers.data.users[0].password,undefined);
});
test('host identity cannot be spoofed and invalid position capacities are rejected',async()=>{
 const created=await call('/api/v2/parties',hostToken,'POST',payload({user_id:first._id,host_name:'Imposter',participants:[]}));assert.equal(created.status,201);assert.equal(created.data.user_id,String(host._id));assert.equal(created.data.participants.length,1);
 assert.equal((await call('/api/v2/parties',hostToken,'POST',payload({position:'GK',required_positions:[{position:'GK',amount:1},{position:'GK',amount:1},{position:'MF',amount:0},{position:'FW',amount:0}]}))).status,400);
});
test('pending requests do not join; only host can review; concurrent approvals cannot overfill a position',async()=>{
 const created=await call('/api/v2/parties',hostToken,'POST',payload());const id=created.data._id;
 assert.equal((await call(`/api/v2/parties/${id}/join`,firstToken,'POST',{position:'GK'})).status,200);
 assert.equal((await call(`/api/v2/parties/${id}/join`,firstToken,'POST',{position:'GK'})).status,409);
 // Legacy join endpoint must follow approval rules too.
 const legacy=await call(`/api/join-party/${id}`,secondToken,'PUT',{position:'GK'});assert.equal(legacy.status,200);assert.equal(legacy.data.participants.length,1);
 const post=(await call(`/api/v2/parties/${id}/requests`,hostToken)).data;assert.equal(post.join_requests.length,2);assert.equal(post.participants.length,1);
 const requests=post.join_requests;assert.equal((await call(`/api/v2/parties/${id}/requests`,firstToken)).status,403);
 assert.equal((await call(`/api/v2/parties/${id}/requests/${requests[0]._id}`,firstToken,'PATCH',{decision:'approved'})).status,403);
 const viewer=(await call(`/api/v2/parties/${id}`,firstToken)).data;assert.equal(viewer.join_requests.length,1);assert.equal(viewer.join_requests[0].user_id,String(first._id));
 const outcomes=await Promise.all(requests.map(request=>call(`/api/v2/parties/${id}/requests/${request._id}`,hostToken,'PATCH',{decision:'approved'})));assert.deepEqual(outcomes.map(result=>result.status).sort(),[200,409]);
 const final=await Post.findById(id);assert.equal(final.participants.length,2);assert.equal(final.participants.filter(member=>member.position==='GK').length,1);
 assert.equal((await call(`/api/delete-post/${id}`,firstToken,'DELETE')).status,400);
 assert.equal((await call(`/api/update-post/${id}`,firstToken,'PUT',{user_id:first._id})).status,400);
});
test('open-party simultaneous joins, cancellation, pending request withdrawal and stale review',async()=>{
 const created=await call('/api/v2/parties',hostToken,'POST',payload({mode:'flexible',access:'open',total_required_players:2}));const id=created.data._id;
 const results=await Promise.all([firstToken,secondToken].map(token=>call(`/api/v2/parties/${id}/join`,token,'POST',{})));assert.deepEqual(results.map(result=>result.status).sort(),[200,409]);
 const winner=results[0].status===200?firstToken:secondToken;assert.equal((await call(`/api/v2/parties/${id}/leave`,winner,'POST',{})).data.participants.length,1);
 assert.equal((await call(`/api/v2/parties/${id}/leave`,hostToken,'POST',{})).status,409);
 const fixed=(await call('/api/v2/parties',hostToken,'POST',payload())).data;
 const requested=(await call(`/api/v2/parties/${fixed._id}/join`,firstToken,'POST',{position:'GK'})).data;
 await call(`/api/v2/parties/${fixed._id}/leave`,firstToken,'POST',{});
 assert.equal((await call(`/api/v2/parties/${fixed._id}/requests/${requested.join_requests[0]._id}`,hostToken,'PATCH',{decision:'approved'})).status,409);
});
test('field management requires owner role and field ownership',async()=>{
 const body={field_name:'New field',field_type:'7v7',mobile_number:'0000000000',address:'Bangkok',price:1200,open:'09:00',close:'23:00',google_map:'https://maps.google.com/'};
 assert.equal((await call('/api/add-fields',firstToken,'POST',body)).status,403);
 const result=await call('/api/add-fields',hostToken,'POST',body);assert.equal(result.status,201);assert.equal(result.data.owner_id,String(host._id));
 assert.equal((await call(`/api/update-fields/${field._id}`,firstToken,'PUT',{price:1})).status,403);
});
test('banned users cannot authenticate',async()=>{await User.findByIdAndUpdate(second._id,{status:'banned'});assert.equal((await call('/api/v2/me',secondToken)).status,401);});
