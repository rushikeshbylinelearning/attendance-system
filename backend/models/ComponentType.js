const mongoose = require('mongoose');

const ComponentTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Component type name is required.'],
        unique: true, // Prevents duplicate names like 'Laptop' and 'Laptop'
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('ComponentType', ComponentTypeSchema);