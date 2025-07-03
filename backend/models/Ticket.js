const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  component: { type: String, required: true },
  issue: { type: String, required: true },
  description: { type: String, required: true },
  screenshot: { type: String }, // optional image URL
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
