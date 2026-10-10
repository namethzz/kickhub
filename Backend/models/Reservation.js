const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    field_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Field",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    start_datetime: { type: Date, required: true },
    end_datetime: { type: Date, required: true },
    payment_amount: { type: Number },
    payment_status: {
      type: String,
      enum: ["paid", "pending", "cancelled"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["reserved", "completed", "cancelled"],
      default: "reserved",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
