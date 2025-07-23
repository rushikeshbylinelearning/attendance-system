// backend/models/AttendanceLog.js
const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendanceDate: { type: String, required: true }, // YYYY-MM-DD
  clockInTime: { type: Date, required: true },
  clockOutTime: { type: Date },
  shiftDurationMinutes: { type: Number, required: true }, // Expected duration from shift group
  penaltyMinutes: { type: Number, default: 0 }, // For overages and extra breaks
  // NEW: Track total minutes consumed from the paid break allowance.
  paidBreakMinutesTaken: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure a user can only have one log per day
attendanceLogSchema.index({ user: 1, attendanceDate: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);