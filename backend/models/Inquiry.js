const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['Hardware', 'Software'], required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Fulfilled', 'Rejected'], default: 'Open' },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', InquirySchema); 