const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const auth = require('../middleware/auth');

// Secure all routes
router.use(auth);

// GET /api/allocations
router.get('/', async (req, res) => {
    // Check for admin/technician role
    if (req.user.role === 'employee') {
        return res.status(403).json({ msg: 'Access Denied' });
    }

    console.log(`--- API HIT: GET /api/allocations by user: ${req.user.id}, role: ${req.user.role} ---`);

    try {
        const allocationRecords = await Allocation.find().sort({ employeeName: 1 });
        
        console.log(`--- DATABASE QUERY: Found ${allocationRecords.length} allocation records. ---`);
        
        res.json(allocationRecords);

    } catch (err) {
        console.error('--- 🚨 API ERROR in GET /api/allocations: ---', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;