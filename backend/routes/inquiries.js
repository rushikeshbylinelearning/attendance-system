const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create a new inquiry (user)
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, urgency } = req.body;
    if (!type || !description || !urgency) {
      return res.status(400).json({ message: 'All required fields must be filled.' });
    }
    const inquiry = new Inquiry({
      user: req.user._id,
      type,
      description,
      urgency,
    });
    await inquiry.save();
    // Notify admin (placeholder)
    console.log(`Admin Notification: New inquiry from user ${req.user.name || req.user._id}`);
    res.status(201).json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all inquiries (admin only)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const inquiries = await Inquiry.find().populate('user', 'name email');
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get inquiries for a specific user (user)
router.get('/user/:userId', auth, async (req, res) => {
  if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const inquiries = await Inquiry.find({ user: req.params.userId });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update inquiry status (admin only)
router.patch('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    if (req.body.status) inquiry.status = req.body.status;
    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete inquiry (admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router; 