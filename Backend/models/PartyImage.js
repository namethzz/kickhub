const mongoose = require("mongoose");

// Party cover photos live in MongoDB (like ProfileImage) so they survive Render's ephemeral disk.
// The client resizes images before upload, so each document stays far below Mongo's 16 MB limit.
const partyImageSchema = new mongoose.Schema(
  {
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, unique: true },
    content_type: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PartyImage", partyImageSchema);
