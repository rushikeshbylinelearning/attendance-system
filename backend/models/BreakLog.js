// backend/models/BreakLog.js
const mongoose = require('mongoose');

const breakLogSchema = new mongoose.Schema({
  attendanceLog: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceLog', required: true },
  breakType: { type: String, enum: ['Paid', 'Unpaid'], required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date }, // null if active
  durationMinutes: { type: Number, default: 0 },
  // NEW: Flag to identify breaks taken after the allowed limit.
  isPenalty: { type: Boolean, default: false, required: true },
}, { timestamps: true });

module.exports = mongoose.model('BreakLog', breakLogSchema);