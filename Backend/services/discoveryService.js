const { capacity, coverUrl } = require('./partyService');

// Public cards contain counts, never member lists or private join requests.
function partyCard(post) {
  return {
    _id: post._id, party_name: post.party_name, mode: post.mode,
    access: post.access, field_id: post.field_id, field_name: post.field_name,
    address: post.address, start_datetime: post.start_datetime,
    end_datetime: post.end_datetime, price: post.price,
    capacity: capacity(post), player_count: post.participants.length,
    cover_url: coverUrl(post),
  };
}
module.exports = { partyCard };
