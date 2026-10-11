const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    chat_messages: { type: [{
      sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      sender_name: { type: String, required: true, maxlength: 100 },
      client_id: { type: String, required: true },
      text: { type: String, required: true, maxlength: 1000 },
      created_at: { type: Date, default: Date.now },
    }], default: [], select: false },
    notification_events: [{
      recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      type: { type: String, enum: ['request', 'submitted', 'approved', 'declined', 'joined', 'cancelled', 'updated', 'party_cancelled'], required: true },
      actor_name: String,
      created_at: { type: Date, default: Date.now },
    }],
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    cancelled_at: Date,
    cancellation_reason: { type: String, maxlength: 300 },
    party_name: { type: String, required: true },
    access: { type: String, enum: ["open", "approval"], default: "open" },
    join_requests: [{ user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, name: String, position: { type: String, enum: ["GK", "FW", "DF", "MF", null], default: null }, status: { type: String, enum: ["pending", "approved", "declined", "cancelled"], default: "pending" }, requested_at: { type: Date, default: Date.now }, reviewed_at: Date }],

    mode: {
      type: String,
      enum: ["fixed", "flexible"], // fixed = ล็อคตำแหน่ง, flexible = ไม่ล็อคตำแหน่ง
      required: true,
    },

    field_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },

    field_name: { type: String, required: true },

    address: { type: String, required: true },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    host_name: { type: String, required: true },

    description: { type: String },
    image: { type: String },

    start_datetime: { type: Date, required: true },
    end_datetime: { type: Date, required: true },

    // ✅ แบบล็อคตำแหน่ง
    required_positions: [
      {
        position: { type: String, enum: ["GK", "FW", "DF", "MF"] }, // "GK", "FW", "DF", "MF", etc.
        amount: { type: Number, default: 0 },
      },
    ],

    // ✅ แบบไม่ล็อคตำแหน่ง
    total_required_players: { type: Number }, // เช่น 14 คนทั้งหมด

    // ✅ รายชื่อผู้เข้าร่วม
    participants: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        name: { type: String },
        position: {
          type: String,
          enum: ["GK", "FW", "DF", "MF", null],
          default: null,
        },
        status: { type: String, default: "Joined" },
        joined_at: { type: Date, default: Date.now },
      },
    ],
    price: { type: Number, required: true },
    google_map: { type: String, required: true },
  },
  { timestamps: true, optimisticConcurrency: true }
);

postSchema.index({ 'notification_events.recipient_id': 1 });

module.exports = mongoose.model("Post", postSchema);
