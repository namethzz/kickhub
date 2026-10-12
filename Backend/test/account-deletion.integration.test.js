const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
process.env.SECRET_KEY='account-deletion-isolated-test-secret';
const app=require('../app');
const User=require('../models/User');
const Field=require('../models/Field');
const Post=require('../models/Post');
const Reservation=require('../models/Reservation');
const { eraseAccount }=require('../services/accountDeletionService');
let replica,server,url;
before(async()=>{
 replica=await MongoMemoryReplSet.create({binary:{version:'7.0.24'},replSet:{count:1}});
 await mongoose.connect(replica.getUri('kickhub_account_test'));
 await Promise.all([User.init(),Field.init(),Post.init(),Reservation.init()]);
 server=app.listen(0);await new Promise(resolve=>server.once('listening',resolve));url=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(mongoose.connection.readyState===1)await mongoose.connection.dropDatabase();await mongoose.disconnect();if(replica)await replica.stop();});
async function call(token,body){return fetch(url+'/api/account',{method:'DELETE',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});}
async function fixtures(){
 const suffix=new mongoose.Types.ObjectId().toString();
 const owner=await User.create({name:'Owner '+suffix,email:suffix+'@example.test',password:'hashed-test-password',role:'owner',google_id:suffix});
 const friend=await User.create({name:'Friend '+suffix,email:'friend'+suffix+'@example.test',password:'hashed-test-password'});
 const owned=await Field.create({owner_id:owner._id,field_name:'Private venue '+suffix,field_type:'7v7',address:'Bangkok',mobile_number:'0000000000',price:1200,open:'09:00',close:'23:00',google_map:'https://maps.google.com/',image:'https://example.test/photo.jpg',description:'Owner description'});
 const common={field_id:owned._id,field_name:owned.field_name,address:'Bangkok',mode:'flexible',total_required_players:10,access:'open',start_datetime:new Date(Date.now()+86400000),end_datetime:new Date(Date.now()+90000000),price:100,google_map:'https://maps.google.com/'};
 const hosted=await Post.create({...common,user_id:owner._id,host_name:owner.name,party_name:'Hosted'});
 const shared=await Post.create({...common,user_id:friend._id,host_name:friend.name,party_name:'Shared',participants:[{user_id:friend._id,name:friend.name},{user_id:owner._id,name:owner.name}],join_requests:[{user_id:owner._id,name:owner.name,status:'approved'}],chat_messages:[{sender_id:owner._id,sender_name:owner.name,client_id:'a',text:'remove my text'},{sender_id:friend._id,sender_name:friend.name,client_id:'b',text:'keep friend text'}],notification_events:[{recipient_id:friend._id,type:'joined',actor_name:owner.name},{recipient_id:owner._id,type:'chat',actor_name:friend.name}]});
 const reservation=await Reservation.create({field_id:owned._id,user_id:owner._id,post_id:hosted._id,start_datetime:common.start_datetime,end_datetime:common.end_datetime});
 const friendBooking=await Reservation.create({field_id:owned._id,user_id:friend._id,post_id:hosted._id,start_datetime:common.start_datetime,end_datetime:common.end_datetime});
 return {owner,friend,owned,hosted,shared,reservation,friendBooking,token:jwt.sign({_id:owner._id},process.env.SECRET_KEY,{expiresIn:'1h'})};
}
test('deletion rejects guests, unconfirmed requests and old sign-in without modifying data',async()=>{
 const f=await fixtures();
 assert.equal((await call(null,{confirmation:'ลบบัญชี'})).status,401);
 assert.equal((await call(f.token,{confirmation:'yes'})).status,400);
 const stale=jwt.sign({_id:f.owner._id,iat:Math.floor(Date.now()/1000)-601},process.env.SECRET_KEY,{expiresIn:'1h'});
 assert.equal((await call(stale,{confirmation:'ลบบัญชี'})).status,401);
 assert(await User.exists({_id:f.owner._id}));assert(await Post.exists({_id:f.hosted._id}));
});
test('confirmed deletion is scoped to the signed-in user and preserves unrelated users and shared content',async()=>{
 const f=await fixtures();
 const response=await call(f.token,{confirmation:'ลบบัญชี',user_id:f.friend._id});
 assert.equal(response.status,200);assert.equal((await response.json()).status,'deleted');
 assert.equal(await User.findById(f.owner._id),null);assert(await User.exists({_id:f.friend._id}));
 assert.equal(await Post.findById(f.hosted._id),null);assert.equal(await Reservation.findById(f.reservation._id),null);
 const shared=await Post.findById(f.shared._id).select('+chat_messages');
 assert.equal(shared.participants.length,1);assert.equal(String(shared.participants[0].user_id),String(f.friend._id));
 assert.equal(shared.join_requests.length,0);assert.equal(shared.chat_messages.length,1);assert.equal(shared.chat_messages[0].text,'keep friend text');
 assert.equal(shared.notification_events.length,1);assert.equal(shared.notification_events[0].actor_name,'ผู้ใช้ที่ลบบัญชี');
 const venue=await Field.findById(f.owned._id);assert.equal(venue.owner_id,null);assert.equal(venue.is_active,false);assert.equal(venue.mobile_number,'');assert.equal(venue.description,'');assert.equal(venue.image,'');
 const booking=await Reservation.findById(f.friendBooking._id);assert.equal(booking.status,'cancelled');assert.equal(booking.post_id,undefined);
 assert.equal((await call(f.token,{confirmation:'ลบบัญชี'})).status,401);
});
test('transaction abort rolls all account changes back together',async()=>{
 const f=await fixtures();
 await assert.rejects(mongoose.connection.transaction(async session=>{await eraseAccount(f.owner._id,session);throw new Error('rollback-test');}),/rollback-test/);
 assert(await User.exists({_id:f.owner._id}));assert(await Post.exists({_id:f.hosted._id}));
 const shared=await Post.findById(f.shared._id).select('+chat_messages');assert.equal(shared.chat_messages.length,2);assert.equal(shared.participants.length,2);
 assert.equal((await Field.findById(f.owned._id)).is_active,true);assert(await Reservation.exists({_id:f.reservation._id}));
});
