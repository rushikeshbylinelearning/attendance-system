const mongoose = require('mongoose');

// FIX #1: We need to import the 'Component' model to check against it.
// Make sure this path is correct for your project structure.
const Component = require('./ComponentType'); 

const InventoryItemSchema = new mongoose.Schema({
    componentType: {
        type: String,
        required: [true, 'Component type is required.'],
        trim: true,
        
        // FIX #2: REMOVE the static 'enum' validator.
        // The validation will now be handled by the middleware hook below.
        // enum: ['Monitor', 'Keyboard', 'Mouse', 'UPS', 'CPU', 'Pen Tab', 'Headphone', 'Laptop'] // <--- THIS LINE IS REMOVED
    },
    brand: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    serialNumber: { type: String, required: true, unique: true, trim: true },
    status: {
        type: String,
        required: true,
        // The status enum is fine because this list is static and doesn't change.
        enum: ['Unassigned', 'Assigned', 'In-Repair', 'Retired'],
        default: 'Unassigned'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    invoiceLink: { type: String, trim: true },
    isWarrantyRegistered: { type: Boolean, default: false },
    specifications: {
        processor: String,
        graphicCard: String,
        ram: String,
        storage: String
    }
}, { timestamps: true });


// FIX #3: ADD this Mongoose middleware hook.
// This function will run automatically BEFORE an item is saved.
InventoryItemSchema.pre('save', async function(next) {
  // 'this' refers to the inventory item document about to be saved.
  // We only run the check if the 'componentType' field was actually changed.
  if (this.isModified('componentType')) {
    try {
      // Check if a component with this type name exists in the Component collection.
      // We assume your Component model has a 'name' field.
      const componentExists = await Component.findOne({ name: this.componentType });

      if (!componentExists) {
        // If it does not exist, create a new validation error.
        const err = new Error(`'${this.componentType}' is not a valid component type. Please add it in the 'Manage Components' section first.`);
        // Pass the error to the next middleware (which is the catch block in your controller).
        return next(err);
      }
    } catch (error) {
      // If there's a database query error, pass it along.
      return next(error);
    }
  }
  // If componentType wasn't modified or if validation passed, continue with the save.
  next();
});


module.exports = mongoose.model('InventoryItem', InventoryItemSchema);