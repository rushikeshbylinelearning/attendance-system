const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  employeeId: { type: String, required: true, unique: true }, // ✅ FIXED: use employeeId
  seatNumber: { type: String },
  role: {
    type: String,
    enum: ['admin', 'user', 'intern', 'employee'],
    default: 'user'
  },
  domain: {
    type: String,
    trim: true,
    default: null 
  }
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);
