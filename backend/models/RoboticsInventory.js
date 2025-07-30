// models/RoboticsInventory.js

const mongoose = require('mongoose');

const RoboticsInventorySchema = new mongoose.Schema({
  partName: {
    type: String,
    required: [true, 'Part name is required'],
    trim: true,
  },
  sku: { // Stock Keeping Unit
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple documents to have a null value for sku
  },
  manufacturer: {
    type: String,
    trim: true,
  },
  partType: {
    type: String,
    required: [true, 'Part type is required'],
    // UPDATED: Added types from your Excel sheet
    enum: [
        'Sensor', 'Motor', 'Controller', 'Microprocessor', 'Microcontroller', 'Motor Driver', 
        'Actuator', 'Actuator/Motor', 'Mechanical Part', 'Chassis', 'Battery', 'Misc'
    ],
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  location: { // e.g., 'Bin A-12', 'Shelf 3-C'
    type: String,
    trim: true,
  },
  supplier: {
    type: String,
    trim: true,
  },
  purchaseDate: {
    type: Date,
  },
  datasheetUrl: { // Link to the component's datasheet
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('RoboticsInventory', RoboticsInventorySchema);