const mongoose = require('mongoose');

const HRInventoryItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true
  }, // e.g., Pen, Diary

  name: {
    type: String,
    required: true,
    trim: true
  }, // Item name or description

  brand: {
    type: String,
    trim: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 0
  },

  status: {
    type: String,
    enum: ['Assigned', 'Unassigned'], // ✅ Must match frontend values
    default: 'Unassigned',
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  purchaseDate: {
    type: Date
  },

  assignedDate: {
    type: Date
  },

  remarks: {
    type: String,
    trim: true
  }

}, { timestamps: true });

module.exports = mongoose.model('HRInventoryItem', HRInventoryItemSchema);
