const mongoose = require('mongoose'); 
const assetSchema = new mongoose.Schema({ 
    owner: { type: String, required: true }, 
    asset: { type: String, required: true }, 
    type: { type: String, required: true }, 
    value: { type: Number, required: true },
}, { timestamps: true }); 
module.exports = mongoose.model('asset', assetSchema); 