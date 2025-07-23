// backend/models/Shift.js
const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  shiftName: { type: String, required: true },
  shiftType: { type: String, enum: ['Fixed', 'Flexible'], required: true },
  startTime: { type: String }, // "HH:mm"
  endTime: { type: String },   // "HH:mm"
  durationHours: { type: Number, required: true },
  // UPDATED: The total paid break allowance for the shift.
  paidBreakMinutes: { type: Number, default: 60 },
}, { timestamps: true });

shiftSchema.pre('save', function(next) {
  if (this.shiftType === 'Fixed' && this.startTime && this.endTime) {
    const [startH, startM] = this.startTime.split(':').map(Number);
    const [endH, endM] = this.endTime.split(':').map(Number);

    const startDate = new Date(0, 0, 0, startH, startM, 0);
    const endDate = new Date(0, 0, 0, endH, endM, 0);

    let diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < 0) {
      diffHours += 24; // Handle overnight shifts
    }
    
    this.durationHours = diffHours;
  }
  next();
});

module.exports = mongoose.model('Shift', shiftSchema);