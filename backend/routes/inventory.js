// routes/inventory.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Import mongoose to validate ObjectIDs
const InventoryItem = require('../models/InventoryItem');
const ComponentType = require('../models/ComponentType');
const auth = require('../middleware/auth');

const adminOrTechOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
        return res.status(403).json({ msg: 'Access denied. Admins or Technicians only.' });
    }
    next();
};

router.use(auth, adminOrTechOnly);

// ✅ --- START: BULK ACTION ROUTES --- ✅
// Specific routes MUST be defined before general routes with parameters like /:id.

// PUT (Update) multiple inventory items in bulk
router.put('/bulk-update', async (req, res) => {
    const { ids, field, value } = req.body;

    // Security: Only allow updating specific fields to prevent malicious updates
    const allowedBulkUpdateFields = ['status', 'purchaseDate', 'warrantyYears', 'isWarrantyRegistered'];
    if (!allowedBulkUpdateFields.includes(field)) {
        return res.status(400).json({ msg: `Bulk update for field '${field}' is not allowed.` });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'Item IDs must be provided as a non-empty array.' });
    }

    try {
        const updatePayload = { $set: { [field]: value } };

        // Edge Case: If status is changed to anything other than 'Assigned', clear the assignedTo field
        if (field === 'status' && value !== 'Assigned') {
            updatePayload.$set.assignedTo = null;
        }

        const result = await InventoryItem.updateMany(
            { _id: { $in: ids } },
            updatePayload
        );

        res.json({ msg: `${result.nModified} items updated successfully.` });
    } catch (err) {
        console.error('Error during bulk inventory update:', err.message);
        res.status(500).send('Server Error');
    }
});

// POST (Delete) multiple inventory items in bulk
// We use POST instead of DELETE for bulk because DELETE requests traditionally don't have a body.
router.post('/bulk-delete', async (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ msg: 'Item IDs must be provided as a non-empty array.' });
    }

    try {
        // Critical Check: Ensure none of the items are currently assigned before deleting.
        const assignedItems = await InventoryItem.find({
            _id: { $in: ids },
            status: 'Assigned'
        });

        if (assignedItems.length > 0) {
            return res.status(400).json({ msg: `Cannot delete. ${assignedItems.length} of the selected items are currently assigned. Please de-allocate them first.` });
        }

        const result = await InventoryItem.deleteMany({ _id: { $in: ids } });

        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'No matching items found to delete.' });
        }

        res.json({ msg: `${result.deletedCount} items deleted successfully.` });
    } catch (err) {
        console.error('Error during bulk inventory deletion:', err.message);
        res.status(500).send('Server Error');
    }
});


// ✅ --- END: BULK ACTION ROUTES --- ✅


// --- START: STANDARD ROUTES ---

// GET count of items
router.get('/count', async (req, res) => {
    try {
        const count = await InventoryItem.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET ONLY UNASSIGNED inventory items (for allocation dropdowns)
router.get('/unassigned', async (req, res) => {
    try {
        const unassignedItems = await InventoryItem.find({ status: 'Unassigned' })
            .sort({ componentType: 1, brand: 1 });
        res.json(unassignedItems);
    } catch (err) {
        console.error('Error fetching unassigned inventory:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET all inventory items
router.get('/', async (req, res) => {
    try {
        const items = await InventoryItem.find()
            .populate('assignedTo', 'name email')
            .sort({ componentType: 1, createdAt: -1 }); // Sort by creation date for recency
        res.json(items);
    } catch (err) {
        console.error('Error fetching inventory:', err.message);
        res.status(500).send('Server Error');
    }
});

// GET single inventory item by ID
router.get('/:id', async (req, res) => {
    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: `Invalid item ID format: ${req.params.id}`});
    }
    try {
        const item = await InventoryItem.findById(req.params.id)
            .populate('assignedTo', 'name email');
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.json(item);
    } catch (err) {
        console.error('Error fetching inventory item:', err.message);
        res.status(500).send('Server Error');
    }
});

// POST (Add) a new inventory item
router.post('/', async (req, res) => {
    try {
        const { componentType, serialNumber } = req.body;
        const typeExists = await ComponentType.findOne({ name: componentType });
        if (!typeExists) {
            return res.status(400).json({ msg: `Component type '${componentType}' is not recognized.` });
        }
        // Check for duplicate serial number if it's not empty
        if (serialNumber) {
            const snExists = await InventoryItem.findOne({ serialNumber });
            if (snExists) {
                return res.status(409).json({ msg: `Serial number '${serialNumber}' already exists.` });
            }
        }
        const newItem = new InventoryItem(req.body);
        await newItem.save();
        const populatedItem = await InventoryItem.findById(newItem._id).populate('assignedTo', 'name email');
        res.status(201).json(populatedItem);
    } catch (err) {
        console.error('Error adding inventory item:', err.message);
        res.status(500).send('Server Error');
    }
});

// PUT (Update) an inventory item by ID
router.put('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: `Invalid item ID format: ${req.params.id}`});
    }
    try {
        const { componentType, serialNumber } = req.body;
        if (componentType) {
            const typeExists = await ComponentType.findOne({ name: componentType });
            if (!typeExists) {
                return res.status(400).json({ msg: `Component type '${componentType}' is not recognized.` });
            }
        }
        // Check for duplicate serial number if it's being changed
        if (serialNumber) {
            const snExists = await InventoryItem.findOne({ serialNumber, _id: { $ne: req.params.id } });
            if (snExists) {
                return res.status(409).json({ msg: `Serial number '${serialNumber}' is already in use by another item.` });
            }
        }
        const updatedItem = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('assignedTo', 'name email');
        if (!updatedItem) {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.json(updatedItem);
    } catch (err) {
        console.error('Error updating inventory item:', err.message);
        res.status(500).send('Server Error');
    }
});

// DELETE an inventory item by ID
router.delete('/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: `Invalid item ID format: ${req.params.id}`});
    }
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }
        if (item.status === 'Assigned') {
            return res.status(400).json({ msg: 'Cannot delete an assigned item. Please de-allocate it first.' });
        }
        await InventoryItem.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Item deleted successfully', id: req.params.id });
    } catch (err) {
        console.error('Error deleting inventory item:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;