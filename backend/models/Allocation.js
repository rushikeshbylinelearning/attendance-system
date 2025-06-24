const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema({
    // A link to the user document for future reference
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // We store the user's details directly for easy display
    employeeName: { type: String, required: true },
    role: { type: String },
    seatNo: { type: String },
    
    // Store the specific serial numbers from your CSV
    // The keys here (e.g., 'Monitor Serial No') will be used in the frontend
    'Monitor make': { type: String },
    'Monitor Serial No': { type: String },
    'Keyboard make': { type: String },
    'KB Serial No': { type: String },
    'Mouse make': { type: String },
    'Mouse Serial No': { type: String },
    'UPS make': { type: String },
    'UPS Serial No': { type: String },
    'CPU Box': { type: String },
    'CPU Serial No': { type: String },
    'Processor': { type: String },
    'GPU': { type: String },
    'RAM': { type: String },
    'HDD': { type: String },
    'Pen Tab': { type: String },
    'Pen Tab Serial No': { type: String },
    'HeadPhone': { type: String },
    'HeadPhone Serial No': { type: String },

    remark: { type: String }
}, {
    timestamps: true,
    collection: 'allocations' // Explicitly name the collection 'allocations'
});

module.exports = mongoose.model('Allocation', AllocationSchema);