// in backend/routes/inventory.js
const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');

// Protect all routes and ensure only Admin/Technician can access
router.use(auth);
router.use((req, res, next) => {
    if (req.user.role === 'employee') {
        return res.status(403).json({ msg: 'Access Denied' });
    }
    next();
});

// GET all inventory items
router.get('/', async (req, res) => {
    try {
        const items = await InventoryItem.find().populate('assignedTo', 'name email').sort({ componentType: 1 });
        res.json(items);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add POST, PUT, DELETE routes here for creating, updating, and deleting items.
// We can build these out after getting the data imported and displayed.

module.exports = router;