// in backend/models/InventoryItem.js
const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
    componentType: {
        type: String,
        required: true,
        enum: ['Monitor', 'Keyboard', 'Mouse', 'CPU', 'RAM', 'Storage', 'Laptop', 'UPS', 'Pen Tab','Headphone' ,'Other'],
        index: true // Add an index for faster searching/filtering
    },
    brand: { type: String, required: true },
    model: { type: String},
    serialNumber: { type: String, unique: true, sparse: true }, // Not all items might have a serial number
    
    // Purchase & Warranty Details
    purchaseDate: { type: Date },
    invoiceLink: { type: String }, // Link to a PDF or cloud storage
    warrantyExpiry: { type: Date },
    isWarrantyRegistered: { type: Boolean, default: false },

    // Component-specific details (using a flexible Mixed type)
    specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {} 
    },
    
    // Tracking Status
    status: {
        type: String,
        enum: ['In Stock', 'Assigned', 'Under Maintenance', 'Retired'],
        default: 'In Stock'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);