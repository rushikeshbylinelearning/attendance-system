const mongoose = require('mongoose');

// Default values for the first time the app runs
const defaultSettings = {
  inventoryComponentTypes: [
    'Monitor', 'Keyboard', 'Mouse', 'CPU', 'RAM', 'Storage', 
    'Laptop', 'UPS', 'Pen Tab', 'Headphone', 'Other'
  ],
  inventoryStatuses: [
    'In Stock', 'Assigned', 'Under Maintenance', 'Retired'
  ],
  userRoles: [
    'employee', 'technician', 'admin'
  ],
};

const settingsSchema = new mongoose.Schema({
  inventoryComponentTypes: {
    type: [String],
    default: defaultSettings.inventoryComponentTypes,
  },
  inventoryStatuses: {
    type: [String],
    default: defaultSettings.inventoryStatuses,
  },
  userRoles: {
    type: [String],
    default: defaultSettings.userRoles,
  },
});

// This function ensures there is always one (and only one) settings document
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create(defaultSettings);
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);