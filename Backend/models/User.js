const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    google_id: { type: String, unique: true, sparse: true },
    facebook_id: { type: String, unique: true, sparse: true },
    role: {
      type: String,
      enum: ["owner", "user"],
      default: "user",
    },
    bio: { type: String, maxlength: 600, default: "" },
    area: { type: String, maxlength: 100, default: "" },
    preferred_position: { type: String, enum: ["GK", "DF", "MF", "FW", ""], default: "" },
    level: { type: String, enum: ["beginner", "casual", "experienced"], default: "casual" },
    profile_photo: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active",
    },
    last_login: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
