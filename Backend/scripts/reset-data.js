const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const { createInterface } = require('node:readline/promises');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { fieldInput } = require('../services/fieldService');
const User = require('../models/User');
const Field = require('../models/Field');
const initialFields = require('../data/initial-fields.json');

function assertLocalKickhub(uri, confirmation) {
  let url;
  try { url = new URL(uri); } catch { throw new Error('Invalid MongoDB URI'); }
  if (confirmation !== 'kickhub' || url.protocol !== 'mongodb:' || !['localhost','127.0.0.1','[::1]'].includes(url.hostname) || url.pathname !== '/kickhub') {
    throw new Error('Reset only supports a local mongodb://.../kickhub database with --confirm=kickhub. No other database can be reset.');
  }
}
function ownerInput(name, email) {
  name = name.trim(); email = email.trim().toLowerCase();
  if (!name || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid owner name and email.');
  return { name, email };
}
async function backupDatabase(db, directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const collections = (await db.listCollections().toArray()).filter(item => !item.name.startsWith('system.'));
  const file = path.join(directory, `kickhub-${new Date().toISOString().replace(/[:.]/g,'-')}-${crypto.randomBytes(4).toString('hex')}.ejson`);
  const contents = { database: db.databaseName, createdAt: new Date().toISOString(), collections: {} };
  for (const collection of collections) contents.collections[collection.name] = { documents: await db.collection(collection.name).find().toArray(), indexes: await db.collection(collection.name).indexes() };
  await fs.writeFile(file, mongoose.mongo.BSON.EJSON.stringify(contents, { relaxed: false }), { flag: 'wx', mode: 0o600 });
  return file;
}
async function main() {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kickhub';
  const confirmation = process.argv.find(arg => arg.startsWith('--confirm='))?.slice('--confirm='.length);
  assertLocalKickhub(uri, confirmation);
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  let owner;
  try {
    console.log('Reset target: local kickhub database only. Stop the API before continuing.');
    console.log('A backup is saved before deletion. Accounts, parties, reservations and other kickhub collections will be reset.');
    owner = ownerInput(await prompt.question('Name for your new field-management account: '), await prompt.question('Email for this account: '));
  } finally { prompt.close(); }
  const password = crypto.randomBytes(18).toString('base64url');
  const account = new User({ ...owner, password: await bcrypt.hash(password, 12), role: 'owner', status: 'active', bio: 'บัญชีผู้ดูแลข้อมูลสนาม ไม่ใช่การยืนยันตัวตนเจ้าของสถานประกอบการ' });
  await account.validate();
  const fields = initialFields.map(input => new Field({ ...fieldInput(input), owner_id: account._id }));
  for (const field of fields) await field.validate();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000, autoIndex: false });
  try {
    const backup = await backupDatabase(mongoose.connection.db, path.join(__dirname, '../../.backups'));
    console.log(`Backup saved: ${backup}`);
    await mongoose.connection.db.dropDatabase();
    await User.createCollection(); await User.createIndexes();
    await account.save();
    await Field.insertMany(fields.map(field => field.toObject()));
    console.log('Reset complete: 1 management account, 1 field, no parties or reservations.');
    console.log(`Login email: ${owner.email}`);
    console.log(`New password (store privately): ${password}`);
    console.log('Existing logins are invalid. Log out in the browser, then sign in with the new account.');
    console.log('Field facts are based on the supplied record; rates and contact details must be verified with the venue.');
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) main().catch(error => { console.error(`Reset failed: ${error.message}`); process.exitCode = 1; });
module.exports = { assertLocalKickhub, ownerInput, backupDatabase };
