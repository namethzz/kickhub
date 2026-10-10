const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fieldInput}=require('../services/fieldService');
const valid=()=>({field_name:'สนามใหม่',field_type:'หญ้าเทียม',mobile_number:'0812345678',address:'กรุงเทพ',price:1200,open:'09:00',close:'01:00',google_map:'https://maps.google.com/'});
test('field write strips identity and accepts overnight hours',()=>{const result=fieldInput({...valid(),owner_id:'spoof',_id:'spoof',price:'1200'});assert.equal(result.owner_id,undefined);assert.equal(result._id,undefined);assert.equal(result.price,1200);assert.equal(result.close,'01:00');});
test('field inputs reject invalid rates, times, URLs and facilities',()=>{for(const patch of [{price:-1},{price:true},{price:Infinity},{open:'25:00'},{image:'blob:local'},{google_map:'javascript:alert(1)'},{facilities:[{}]}])assert.throws(()=>fieldInput({...valid(),...patch}),error=>error.status===400);});
test('partial field edits support visibility and permanent image URLs',()=>{assert.deepEqual(fieldInput({is_active:false,image:'https://example.com/pitch.jpg',owner_id:'spoof'},true),{image:'https://example.com/pitch.jpg',is_active:false});assert.throws(()=>fieldInput({is_active:'false'},true));});
