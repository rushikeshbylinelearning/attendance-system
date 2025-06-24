const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const [openTickets, totalAssets, usersByRole] = await Promise.all([
            Ticket.countDocuments({ status: 'open' }),
            Asset.countDocuments(),
            User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
        ]);
        const rolesCount = usersByRole.reduce((acc, role) => {
            acc[role._id] = role.count;
            return acc;
        }, {});
        res.json({ openTickets, totalAssets, usersByRole: rolesCount });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;