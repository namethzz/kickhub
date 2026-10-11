const { test, after } = require('node:test');
const assert = require('node:assert/strict');
process.env.CLIENT_ORIGIN='https://kickhub.example, https://second.example';
const app=require('../app');
const server=app.listen(0,'127.0.0.1');
after(()=>new Promise(resolve=>server.close(resolve)));
async function request(origin,method='GET'){
  if(!server.listening)await new Promise(resolve=>server.once('listening',resolve));
  return fetch(`http://127.0.0.1:${server.address().port}/api/health`,{method,headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
}
test('health returns unavailable before database connection without exposing details',async()=>{
  const result=await request('https://kickhub.example');
  assert.equal(result.status,503);
  assert.deepEqual(await result.json(),{status:'unavailable'});
  assert.equal(result.headers.get('cache-control'),'no-store');
});
test('CORS permits both configured origins and bearer preflight',async()=>{
  for(const origin of ['https://kickhub.example','https://second.example']){
    const result=await request(origin,'OPTIONS');
    assert.equal(result.status,204);
    assert.equal(result.headers.get('access-control-allow-origin'),origin);
    assert.match(result.headers.get('access-control-allow-headers'),/authorization/i);
  }
});
test('CORS does not authorize an unrelated origin',async()=>{
  const result=await request('https://unrelated.example','OPTIONS');
  assert.equal(result.headers.get('access-control-allow-origin'),null);
});
