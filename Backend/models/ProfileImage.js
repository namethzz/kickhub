const mongoose = require("mongoose");

// Profile photos live in MongoDB so they survive Render's ephemeral disk and need no extra service.
// The client resizes images before upload, so each document stays far below Mongo's 16 MB limit.
const profileImageSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["avatar", "cover"], required: true },
    content_type: { type: String, enum: ["image/jpeg", "image/png", "image/webp"], required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);
profileImageSchema.index({ user_id: 1, kind: 1 }, { unique: true });

module.exports = mongoose.model("ProfileImage", profileImageSchema);
