const express = require('express');
const router = express.Router();
const User = require('../models/User');
const InventoryItem = require('../models/InventoryItem');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/users
router.get('/', async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Access denied. Admins only.' });
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});
router.get('/allocations', async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Access Denied' });
    }
  console.log('--- API HIT: GET /api/users/allocations ---');
    try {
        const allocations = await User.aggregate([
            // ... the $lookup and $project stages ...
        ]);
        
        console.log(`--- AGGREGATION FOUND: ${allocations.length} user records. ---`);
        
        if (allocations.length > 0) {
            console.log("--- DATA SENT TO FRONTEND (First User): ---");
            console.log(JSON.stringify(allocations[0], null, 2));
            console.log("-----------------------------------------");
        }
        
        res.json(allocations);
    } catch (err) {
        console.error('Error fetching allocations:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;