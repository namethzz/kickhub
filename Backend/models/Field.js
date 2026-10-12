const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    field_name: { type: String, required: true },
    field_type: { type: String, required: true },
    mobile_number: { type: String, default: "", required: function () { return !!this.owner_id; } },
    address: { type: String, default: "", required: function () { return !!this.owner_id; } },
    price: { type: Number, default: null, min: 0, required: function () { return !!this.owner_id; } },
    open: { type: String, default: "", required: function () { return !!this.owner_id; } },
    close: { type: String, default: "", required: function () { return !!this.owner_id; } },
    source_url: { type: String },
    checked_on: { type: String },
    price_note: { type: String },
    hours_note: { type: String },
    address_source: { type: String },
    image_note: { type: String },
    facilities: { type: Object },
    image: { type: String },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    google_map: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Field", fieldSchema);
