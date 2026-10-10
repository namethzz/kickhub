const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "user"],
      default: "user",
    },
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
