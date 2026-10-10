const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertLocalKickhub, ownerInput, backupDatabase } = require('../scripts/reset-data');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const mongoose = require('mongoose');
test('reset accepts only explicitly named local kickhub database', () => {
  assert.doesNotThrow(() => assertLocalKickhub('mongodb://127.0.0.1:27017/kickhub', 'kickhub'));
  for (const [uri, confirm] of [['mongodb://127.0.0.1:27017/kickhub', undefined], ['mongodb://localhost/admin', 'kickhub'], ['mongodb://localhost/kickhub_test', 'kickhub'], ['mongodb://remote.example/kickhub', 'kickhub'], ['mongodb+srv://localhost/kickhub', 'kickhub'], ['mongodb://localhost/kickhub/extra', 'kickhub']]) assert.throws(() => assertLocalKickhub(uri, confirm));
});
test('new management identity must be supplied and valid', () => {
  assert.deepEqual(ownerInput(' Nameth ', 'NAME@example.com'), { name: 'Nameth', email: 'name@example.com' });
  assert.throws(() => ownerInput('', 'name@example.com')); assert.throws(() => ownerInput('Name', 'invalid'));
});
test('backup preserves BSON values and indexes without database mutation', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'kickhub-backup-test-'));
  const id = new mongoose.Types.ObjectId();
  const db = { databaseName: 'kickhub', listCollections: () => ({ toArray: async () => [{ name: 'users' }] }), collection: () => ({ find: () => ({ toArray: async () => [{ _id: id, createdAt: new Date(0) }] }), indexes: async () => [{ name: '_id_', key: { _id: 1 } }] }) };
  try {
    const file = await backupDatabase(db, directory);
    const restored = mongoose.mongo.BSON.EJSON.parse(await fs.readFile(file, 'utf8'));
    assert.equal(String(restored.collections.users.documents[0]._id), String(id));
    assert.equal(restored.collections.users.documents[0].createdAt.getTime(), 0);
    assert.equal(restored.collections.users.indexes[0].name, '_id_');
  } finally { await fs.rm(directory, { recursive: true }); }
});
