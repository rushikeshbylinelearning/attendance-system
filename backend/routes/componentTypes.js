// routes/componentTypes.js
const express = require('express');
const router = express.Router();
const ComponentType = require('../models/ComponentType');

// GET all component types
router.get('/', async (req, res) => {
  try {
    const types = await ComponentType.find().sort({ name: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ msg: 'Server error while fetching component types' });
  }
});

// POST new component type
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) return res.status(400).json({ msg: 'Name is required' });

    const existing = await ComponentType.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ msg: 'Component type already exists' });

    const newType = new ComponentType({ name: name.trim(), description });
    await newType.save();
    res.status(201).json(newType);
  } catch (err) {
    res.status(500).json({ msg: 'Server error while creating component type' });
  }
});

// PUT update component type
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    const updated = await ComponentType.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), description },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: 'Component type not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: 'Server error while updating component type' });
  }
});

// DELETE component type
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await ComponentType.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Component type not found' });

    res.json({ msg: 'Component type deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error while deleting component type' });
  }
});

module.exports = router;
