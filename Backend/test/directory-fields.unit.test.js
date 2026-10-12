const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Field = require('../models/Field');
const { fieldInput } = require('../services/fieldService');

test('directory fields allow unknown details without assigning an owner or free price', () => {
  const field = new Field({ field_name: 'Directory pitch', field_type: 'หญ้าเทียม', google_map: 'https://maps.google.com/', hours_note: 'ยังไม่ยืนยัน', price_note: 'สอบถามสนาม' });
  assert.equal(field.validateSync(), undefined);
  assert.equal(field.owner_id, null);
  assert.equal(field.price, null);
  assert.equal(field.hours_note, 'ยังไม่ยืนยัน');
});
test('owner-managed fields and owner forms still require complete details', () => {
  const field = new Field({ owner_id: new mongoose.Types.ObjectId(), field_name: 'Owner pitch', field_type: 'หญ้าเทียม', google_map: 'https://maps.google.com/' });
  const error = field.validateSync();
  for (const key of ['price', 'address', 'mobile_number', 'open', 'close']) assert(error.errors[key]);
  assert.throws(() => fieldInput({ field_name: 'Incomplete' }));
});
