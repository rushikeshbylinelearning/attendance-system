// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // --- NEW FIELDS ---
    employeeId: { type: String, required: true, unique: true },
    seatNumber: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['user', 'technician', 'admin'], 
        default: 'user' 
    },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);