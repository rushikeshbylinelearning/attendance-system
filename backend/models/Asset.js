const mongoose = require('mongoose');
const AssetSchema = new mongoose.Schema({
    assetName: { type: String, required: true },
    assetType: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    purchaseDate: { type: Date },
    status: { type: String, enum: ['in-use', 'in-stock', 'under-repair', 'retired'], default: 'in-stock' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });
module.exports = mongoose.model('Asset', AssetSchema);