const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    field_name: { type: String, required: true },
    field_type: { type: String, required: true },
    mobile_number: { type: String, required: true },
    address: { type: String, required: true },
    price: { type: Number, required: true },
    open: { type: String, required: true },
    close: { type: String, required: true },
    facilities: { type: Object },
    image: { type: String },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    google_map: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Field", fieldSchema);
