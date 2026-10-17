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
 async function signup(name,role='user'){const result=await call('/api/auth/register',null,'POST',{name,email:`${name}@example.test`,password:'password123',role});assert.equal(result.status,201);return {user:await User.findOne({name}),token:result.data.token};}
 ({user:host,token:hostToken}=await signup('Host','owner'));({user:first,token:firstToken}=await signup('First'));({user:second,token:secondToken}=await signup('Second'));
 field=await Field.create({owner_id:host._id,field_name:'Test field',field_type:'7v7',mobile_number:'0000000000',address:'Bangkok',price:1200,open:'09:00',close:'23:00',google_map:'https://maps.google.com/'});
});
after(async()=>{if(server)await new Promise(resolve=>server.close(resolve));if(mongoose.connection.readyState===1)await mongoose.connection.dropDatabase();await mongoose.disconnect();if(mongo)await mongo.stop();});
test('directory photo backfill fills only verified missing images and preserves custom and owner images', async () => {
 const photos=require('../data/directory-field-photos.json');
 const {fillDirectoryPhotos}=require('../services/directoryPhotoService');
 const base={field_type:'หญ้าเทียม',google_map:'https://maps.google.com/'};
 await Field.create([
  {...base,_id:photos[0]._id,field_name:photos[0].field_name},
  {...base,_id:photos[1]._id,field_name:photos[1].field_name,image:'https://example.test/custom.jpg'},
  {...base,_id:photos[2]._id,field_name:photos[2].field_name,owner_id:host._id,address:'Bangkok',mobile_number:'0000000000',price:1000,open:'09:00',close:'23:00'},
 ]);
 const unrelated=await Field.create({...base,field_name:photos[3].field_name});
 await fillDirectoryPhotos();
 assert.equal((await Field.findById(photos[0]._id)).image,photos[0].image);
 assert.equal((await Field.findById(photos[1]._id)).image,'https://example.test/custom.jpg');
 assert.equal((await Field.findById(photos[2]._id)).image,undefined);
 assert.equal((await Field.findById(unrelated._id)).image,undefined);
 assert.equal((await fillDirectoryPhotos()).modifiedCount,0);
 await Field.deleteMany({_id:{$in:[photos[0]._id,photos[1]._id,photos[2]._id,unrelated._id]}});
});
test('players can create parties at ownerless directory fields with unknown details', async () => {
 const directory=await Field.create({field_name:'Directory field',field_type:'Outdoor',google_map:'https://maps.google.com/',price_note:'สอบถามราคา',hours_note:'ยังไม่ทราบ'});
 const detail=await call(`/api/v2/fields/${directory._id}`,firstToken);
 assert.equal(detail.status,200);assert.equal(detail.data.owner_id,null);assert.equal(detail.data.price,null);assert.equal(detail.data.price_note,'สอบถามราคา');
 const created=await call('/api/v2/parties',firstToken,'POST',payload({field_id:String(directory._id),price:100}));
 assert.equal(created.status,201);assert.equal(created.data.field_id,String(directory._id));assert.equal(created.data.price,100);
});
test('profile privacy, authenticated editing and normalized auth tokens',async()=>{
 assert.equal((await call('/api/v2/me',null)).status,401);
 const login=await call('/api/auth/login',null,'POST',{email:'FIRST@example.test',password:'password123'});assert.equal(login.status,200);
 const updated=await call('/api/v2/me',firstToken,'PATCH',{name:'Player one',bio:'Goalkeeper',preferred_position:'GK',role:'owner',password:'changed',email:'attack@example.test'});assert.equal(updated.status,200);assert.equal(updated.data.role,'user');assert.equal(updated.data.email,'first@example.test');
 const profile=await call(`/api/v2/profiles/${first._id}`,null);assert.equal(profile.status,200);assert.equal(profile.data.bio,'Goalkeeper');for(const key of ['email','password','last_login'])assert.equal(profile.data[key],undefined);
 const legacy=jwt.sign({id:first._id},process.env.SECRET_KEY);assert.equal((await call('/api/v2/me',legacy)).status,200);
});
test('host identity cannot be spoofed and invalid position capacities are rejected',async()=>{
 const created=await call('/api/v2/parties',hostToken,'POST',payload({user_id:first._id,host_name:'Imposter',participants:[]}));assert.equal(created.status,201);assert.equal(created.data.user_id,String(host._id));assert.equal(created.data.participants.length,1);
 assert.equal((await call('/api/v2/parties',hostToken,'POST',payload({position:'GK',required_positions:[{position:'GK',amount:1},{position:'GK',amount:1},{position:'MF',amount:0},{position:'FW',amount:0}]}))).status,400);
});
test('pending requests do not join; only host can review; concurrent approvals cannot overfill a position',async()=>{
 const created=await call('/api/v2/parties',hostToken,'POST',payload());const id=created.data._id;
 assert.equal((await call(`/api/v2/parties/${id}/join`,firstToken,'POST',{position:'GK'})).status,200);
 assert.equal((await call(`/api/v2/parties/${id}/join`,firstToken,'POST',{position:'GK'})).status,409);
 const second=await call(`/api/v2/parties/${id}/join`,secondToken,'POST',{position:'GK'});assert.equal(second.status,200);assert.equal(second.data.participants.length,1);
 const post=(await call(`/api/v2/parties/${id}/requests`,hostToken)).data;assert.equal(post.join_requests.length,2);assert.equal(post.participants.length,1);
 const requests=post.join_requests;assert.equal((await call(`/api/v2/parties/${id}/requests`,firstToken)).status,403);
 assert.equal((await call(`/api/v2/parties/${id}/requests/${requests[0]._id}`,firstToken,'PATCH',{decision:'approved'})).status,403);
 const viewer=(await call(`/api/v2/parties/${id}`,firstToken)).data;assert.equal(viewer.join_requests.length,1);assert.equal(viewer.join_requests[0].user_id,String(first._id));
 const outcomes=await Promise.all(requests.map(request=>call(`/api/v2/parties/${id}/requests/${request._id}`,hostToken,'PATCH',{decision:'approved'})));assert.deepEqual(outcomes.map(result=>result.status).sort(),[200,409]);
 const final=await Post.findById(id);assert.equal(final.participants.length,2);assert.equal(final.participants.filter(member=>member.position==='GK').length,1);
 assert.equal((await call(`/api/v2/parties/${id}/cancel`,firstToken,'POST',{})).status,403);
 assert.equal((await call(`/api/v2/parties/${id}`,firstToken,'PATCH',{user_id:first._id})).status,400);
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
 const id=result.data._id;
 const image='https://example.com/pitch.jpg';
 const edited=await call(`/api/update-fields/${id}`,hostToken,'PUT',{image,is_active:false,owner_id:String(first._id)});
 assert.equal(edited.status,200);assert.equal(edited.data.image,image);assert.equal(edited.data.owner_id,String(host._id));
 assert.equal((await call('/api/v2/fields',firstToken)).data.some(item=>item._id===id),false);
 assert.equal((await call('/api/v2/parties',hostToken,'POST',{...payload(),field_id:id})).status,404);
 assert.equal((await call(`/api/update-fields/${id}`,hostToken,'PUT',{is_active:true})).status,200);
 assert.equal((await call('/api/v2/fields',firstToken)).data.some(item=>item._id===id),true);
 assert.equal((await call(`/api/update-fields/${id}`,hostToken,'PUT',{price:-1})).status,400);
 assert.equal((await call(`/api/update-fields/${id}`,hostToken,'PUT',{image:'blob:temporary'})).status,400);

});
test('field discovery exposes active details and filters parties by field',async()=>{
 assert.equal((await call(`/api/v2/fields/${field._id}`,null)).status,401);
 const detail=await call(`/api/v2/fields/${field._id}`,firstToken);
 assert.equal(detail.status,200);assert.equal(detail.data.field_name,'Test field');assert.equal(detail.data.mobile_number,'0000000000');assert.equal(detail.data.owner_id,String(host._id));assert.equal(detail.data.__v,undefined);
 assert.equal((await call('/api/v2/fields/invalid',firstToken)).status,400);
 const alternate=await Field.create({owner_id:host._id,field_name:'Second field',field_type:'Indoor',mobile_number:'0000000000',address:'Bangkok',price:900,open:'08:00',close:'22:00',google_map:'https://maps.google.com/'});
 const created=await call('/api/v2/parties',hostToken,'POST',payload({field_id:String(alternate._id)}));assert.equal(created.status,201);
 const filtered=await call(`/api/v2/parties?field=${alternate._id}`,firstToken);
 assert.equal(filtered.status,200);assert.equal(filtered.data.length,1);assert.equal(filtered.data[0]._id,created.data._id);
 assert.equal((await call('/api/v2/parties?field=invalid',firstToken)).status,400);
 await Field.findByIdAndUpdate(alternate._id,{is_active:false});
 assert.equal((await call(`/api/v2/fields/${alternate._id}`,firstToken)).status,404);
 assert.equal((await call('/api/v2/fields',firstToken)).data.some(item=>item._id===String(alternate._id)),false);
 assert.equal((await call('/api/v2/fields',firstToken)).data.some(item=>'mobile_number' in item),false);
});
test('banned users cannot authenticate',async()=>{await User.findByIdAndUpdate(second._id,{status:'banned'});try{assert.equal((await call('/api/v2/me',secondToken)).status,401);}finally{await User.findByIdAndUpdate(second._id,{status:'active'});}});

test('notifications are saved atomically with requests and reviews, scoped privately, and acknowledged across sessions', async () => {
 const created=await call('/api/v2/parties',hostToken,'POST',payload()); const id=created.data._id;
 const requested=await call(`/api/v2/parties/${id}/join`,firstToken,'POST',{position:'GK'});assert.equal(requested.status,200);assert.equal(requested.data.notification_events,undefined);
 const inbox=await call('/api/v2/notifications',hostToken);assert.equal(inbox.status,200);
 assert(inbox.data.items.some(item=>item.party_id===id&&item.type==='request'));
 const other=await call('/api/v2/notifications',secondToken);assert(!other.data.items.some(item=>item.party_id===id));
 const request=(await call(`/api/v2/parties/${id}/requests`,hostToken)).data.join_requests.find(request=>request.user_id===String(first._id));
 assert.equal((await call(`/api/v2/parties/${id}/requests/${request._id}`,hostToken,'PATCH',{decision:'approved'})).status,200);
 const mine=await call('/api/v2/notifications',firstToken);assert(mine.data.items.some(item=>item.party_id===id&&item.type==='approved'&&!item.read));
 assert.equal((await call('/api/v2/notifications/read',firstToken,'PATCH',{through:mine.data.asOf})).status,200);
 const read=await call('/api/v2/notifications?filter=unread',firstToken);assert.equal(read.data.unread,0);assert.equal(read.data.total,0);
 const stored=await User.findById(first._id);assert.equal(stored.notifications_read_at.toISOString(),mine.data.asOf);
});

test('host edits notify players and cancellation is preserved in history but excluded from discovery', async () => {
 const created=await call('/api/v2/parties',hostToken,'POST',payload());const id=created.data._id;
 await call(`/api/v2/parties/${id}/join`,firstToken,'POST',{position:'GK'});
 assert.equal((await call(`/api/v2/parties/${id}`,firstToken,'PATCH',{price:1})).status,403);
 const edited=await call(`/api/v2/parties/${id}`,hostToken,'PATCH',{price:150});assert.equal(edited.status,200);assert.equal(edited.data.price,150);
 const notifications=await call('/api/v2/notifications',firstToken);assert(notifications.data.items.some(item=>item.party_id===id&&item.type==='updated'));
 const cancelled=await call(`/api/v2/parties/${id}/cancel`,hostToken,'POST',{reason:'Field unavailable'});assert.equal(cancelled.status,200);assert.equal(cancelled.data.status,'cancelled');assert.equal(cancelled.data.notification_events,undefined);
 assert.equal((await call(`/api/v2/parties/${id}/join`,secondToken,'POST',{position:'GK'})).status,409);
 const upcoming=await call('/api/v2/my-parties?scope=host',hostToken);assert(!upcoming.data.parties.some(party=>party._id===id));
 const history=await call('/api/v2/my-parties?scope=host&period=history',hostToken);assert(history.data.parties.some(party=>party._id===id));
 const applicantHistory=await call('/api/v2/my-parties?scope=requested&period=history',firstToken);assert(applicantHistory.data.parties.some(party=>party._id===id&&party.status==='cancelled'));
 const discovery=await call('/api/v2/discover',null);assert(!discovery.data.parties.some(party=>party._id===id));
 const stored=await Post.findById(id);assert.equal(stored.notification_events.filter(event=>event.type==='party_cancelled').length,1);
 await call(`/api/v2/parties/${id}/cancel`,hostToken,'POST',{});
 assert.equal((await Post.findById(id)).notification_events.filter(event=>event.type==='party_cancelled').length,1);
});
