const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Allocation = require('../models/Allocation');
const auth = require('../middleware/auth');
const InventoryItem = require('../models/InventoryItem');

router.use(auth);

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admins only.' });
  }
  next();
};

// GET all users
router.get('/', adminOnly, async (req, res) => {
  try {
    // CORRECTED: The .select('-password') has been removed.
    const users = await User.find(); 
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// CREATE new user (admin only)
router.post('/', adminOnly, async (req, res) => {
  const { name, email, password, role, employeeId, seatNumber } = req.body;
  if (!name || !email || !password || !role || !employeeId || !seatNumber) {
    return res.status(400).json({ msg: 'Please enter all fields.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User with this email already exists.' });

    let empIdCheck = await User.findOne({ employeeId });
    if (empIdCheck) return res.status(400).json({ msg: 'User with this Employee ID already exists.' });

    user = new User({ name, email, password, role, employeeId, seatNumber });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const newUser = user.toObject();
    delete newUser.password;

    req.io.emit('userAdded', newUser);
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE user (admin only)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ msg: 'You cannot delete your own account.' });
    }

    await User.deleteOne({ _id: req.params.id });
    req.io.emit('userDeleted', req.params.id);
    res.json({ msg: 'User removed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ✅ UPDATE user role (admin only)
router.put('/:id/role', adminOnly, async (req, res) => {
  const { role } = req.body;

  if (!['user', 'technician', 'admin'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role specified.' });
  }

  try {
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) return res.status(404).json({ msg: 'User not found.' });

    if (userToUpdate._id.toString() === req.user.id && role !== 'admin') {
      return res.status(400).json({ msg: 'You cannot demote your own account.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    req.io.emit('userUpdated', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ✅ ✅ NEW: UPDATE full user info (admin only)
router.put('/:id', adminOnly, async (req, res) => {
  const { name, email, seatNumber, employeeId, role } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, seatNumber, employeeId, role },
      { new: true }
    ).select('-password');

    req.io.emit('userUpdated', updatedUser);
    res.json(updatedUser);
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).send('Server Error');
  }
});

// GET user allocations (admin only)
router.get('/allocations', adminOnly, async (req, res) => {
  try {
    const allocations = await User.aggregate([]);
    res.json(allocations);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// GET assets assigned to current user
router.get('/my-assets', async (req, res) => {
  try {
    const allocations = await InventoryItem.find({
      "Employee Name": { $regex: new RegExp(`^${req.user.name}$`, 'i') }
    });
    res.json({
      profile: { ...req.user },
      assets: allocations
    });
  } catch (err) {
    console.error('Error fetching user assets:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
