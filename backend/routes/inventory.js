const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const ComponentType = require('../models/ComponentType');
const auth = require('../middleware/auth');

// Middleware to ensure only Admin/Technician can access
const adminOrTechOnly = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'technician') {
        return res.status(403).json({ msg: 'Access denied. Admins or Technicians only.' });
    }
    next();
};

// Protect all routes
router.use(auth, adminOrTechOnly);

// GET count of items
router.get('/count', async (req, res) => {
    try {
        const count = await InventoryItem.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET all inventory items
router.get('/', async (req, res) => {
    try {
        const items = await InventoryItem.find()
            .populate('assignedTo', 'name email')
            .sort({ componentType: 1 });
        res.json(items);
    } catch (err) {
        console.error('Error fetching inventory:', err.message);
        res.status(500).send('Server Error');
    }
});

// ✅ ADD THIS
// GET single inventory item by ID
router.get('/:id', async (req, res) => {
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
        const { componentType } = req.body;

        // ✅ Check if componentType exists in dynamic types
        const typeExists = await ComponentType.findOne({ name: componentType });
        if (!typeExists) {
            return res.status(400).json({ msg: `Component type '${componentType}' is not recognized.` });
        }

        const newItem = new InventoryItem(req.body);
        await newItem.save();

        const populatedItem = await InventoryItem.findById(newItem._id)
            .populate('assignedTo', 'name email');
        res.status(201).json(populatedItem);
    } catch (err) {
        console.error('Error adding inventory item:', err.message);
        res.status(500).send('Server Error');
    }
});

// PUT (Update) an inventory item by ID
router.put('/:id', async (req, res) => {
    try {
        const { componentType } = req.body;

        if (componentType) {
            const typeExists = await ComponentType.findOne({ name: componentType });
            if (!typeExists) {
                return res.status(400).json({ msg: `Component type '${componentType}' is not recognized.` });
            }
        }

        const updatedItem = await InventoryItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('assignedTo', 'name email');

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
