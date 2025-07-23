const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const LeaveRequest = require('../models/LeaveRequest');

// POST /api/leaves/request - Submit a new leave request
router.post('/request', authenticateToken, async (req, res) => {
    const { requestType, leaveDates, alternateDate, reason } = req.body;
    const { userId } = req.user;

    // Basic Validation
    if (!requestType || !leaveDates || leaveDates.length === 0 || !reason) {
        return res.status(400).json({ error: 'Missing required fields for the request.' });
    }
    if (requestType === 'Swap' && !alternateDate) {
        return res.status(400).json({ error: 'Alternate date is required for a swap request.' });
    }

    try {
        const newRequest = await LeaveRequest.create({
            employee: userId,
            requestType,
            leaveDates,
            alternateDate: alternateDate || null,
            reason,
        });
        res.status(201).json({ message: 'Request submitted successfully!', request: newRequest });
    } catch (error) {
        console.error('Error submitting leave request:', error);
        res.status(500).json({ error: 'Internal server error while submitting request.' });
    }
});

// GET /api/leaves/my-requests - Get all requests for the logged-in user
router.get('/my-requests', authenticateToken, async (req, res) => {
    try {
        const requests = await LeaveRequest.find({ employee: req.user.userId }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({ error: 'Failed to fetch your requests.' });
    }
});

module.exports = router;