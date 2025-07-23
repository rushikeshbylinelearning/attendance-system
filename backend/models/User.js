// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'HR', 'Employee', 'Intern'], default: 'Employee' },
  designation: { type: String },
  department: { type: String },
  joiningDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  shiftGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
  // NEW FIELD
  alternateSaturdayPolicy: {
    type: String,
    enum: ['Week 1 & 3 Off', 'Week 2 & 4 Off', 'All Saturdays Working', 'All Saturdays Off'],
    default: 'All Saturdays Working'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);