const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const HRInventoryItem = require('../models/HRInventoryItem');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth);

// GET all HR inventory items
router.get('/', async (req, res) => {
  try {
    const items = await HRInventoryItem.find()
      .populate('assignedTo', 'name email employeeId')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('❌ GET /api/hr-inventory error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET single HR inventory item by ID
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid item ID format' });
  }
  try {
    const item = await HRInventoryItem.findById(req.params.id)
      .populate('assignedTo', 'name email employeeId');
    if (!item) return res.status(404).json({ msg: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error(`❌ GET /api/hr-inventory/${req.params.id} error:`, err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// POST create new HR inventory item
router.post('/', async (req, res) => {
  try {
    console.log('📥 POST /api/hr-inventory body:', req.body);

    const newItem = new HRInventoryItem(req.body);
    await newItem.save();

    const populated = await HRInventoryItem.findById(newItem._id)
      .populate('assignedTo', 'name email employeeId');

    res.status(201).json(populated);
  } catch (err) {
    console.error('❌ POST /api/hr-inventory error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// PUT update HR inventory item
router.put('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid item ID format' });
  }
  try {
    const updated = await HRInventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('assignedTo', 'name email employeeId');

    if (!updated) return res.status(404).json({ msg: 'Item not found' });
    res.json(updated);
  } catch (err) {
    console.error(`❌ PUT /api/hr-inventory/${req.params.id} error:`, err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// DELETE HR inventory item
router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ msg: 'Invalid item ID format' });
  }
  try {
    const deleted = await HRInventoryItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Item not found' });
    res.json({ msg: 'Item deleted' });
  } catch (err) {
    console.error(`❌ DELETE /api/hr-inventory/${req.params.id} error:`, err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
