const Field = require('../models/Field');
const photos = require('../data/directory-field-photos.json');

// Only fill the originally imported, unowned directory records with missing photos.
// Existing owner-supplied images and unrelated records are never overwritten.
async function fillDirectoryPhotos() {
  return Field.bulkWrite(photos.map(photo => ({
    updateOne: {
      filter: {
        _id: photo._id,
        field_name: photo.field_name,
        owner_id: null,
        image: { $in: ['', null, '/สนามของเรา.png'] },
      },
      update: { $set: {
        image: photo.image,
        image_note: `ภาพสนามจาก ${photo.source_url}`,
      } },
      upsert: false,
    },
  })));
}
module.exports = { fillDirectoryPhotos };
