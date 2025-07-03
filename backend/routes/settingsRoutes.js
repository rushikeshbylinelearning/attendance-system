const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const auth = require('../middleware/auth'); // Your existing auth middleware

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }
  next();
};

// All users can get settings to populate dropdowns
router.get('/', auth, getSettings);

// Only admins can update settings
router.put('/', auth, adminOnly, updateSettings);

module.exports = router;