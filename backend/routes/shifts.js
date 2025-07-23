// backend/routes/shifts.js
const express = require('express');
const router = express.Router();

// --- Middleware ---
const authenticateToken = require('../middleware/authenticateToken');

// --- Models ---
const Shift = require('../models/Shift');
const User = require('../models/User');

// Middleware to check for Admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access forbidden: Requires Admin role.' });
    }
    next();
};

// GET /api/admin/shifts
router.get('/', [authenticateToken, isAdmin], async (req, res) => {
    try {
        const shifts = await Shift.find().sort({ shiftName: 1 }).lean();
        res.json(shifts);
    } catch (err) {
        console.error('Error fetching shifts:', err);
        res.status(500).json({error: 'Failed to fetch shifts.'});
    }
});

// POST /api/admin/shifts
router.post('/', [authenticateToken, isAdmin], async (req, res) => {
    const { shiftName, startTime, endTime, durationHours, paidBreakMinutes, shiftType } = req.body;
    try {
        const newShift = await Shift.create({
            shiftName,
            startTime: startTime || null,
            endTime: endTime || null,
            durationHours,
            paidBreakMinutes,
            shiftType
        });
        res.status(201).json(newShift);
    } catch (err) {
        console.error('Error creating shift:', err);
        res.status(500).json({error: 'Failed to create shift.'});
    }
});

// PUT /api/admin/shifts/:id
router.put('/:id', [authenticateToken, isAdmin], async (req, res) => {
    const { id } = req.params;
    const { shiftName, startTime, endTime, durationHours, paidBreakMinutes, shiftType } = req.body;
    try {
        const updatedShift = await Shift.findByIdAndUpdate(id, {
            shiftName,
            startTime: startTime || null,
            endTime: endTime || null,
            durationHours,
            paidBreakMinutes,
            shiftType
        }, { new: true }); // { new: true } returns the updated document
        if (!updatedShift) { return res.status(404).json({ error: "Shift not found." }); }
        res.json(updatedShift);
    } catch (err) {
        console.error('Error updating shift:', err);
        res.status(500).json({error: 'Failed to update shift.'});
    }
});

// DELETE /api/admin/shifts/:id
router.delete('/:id', [authenticateToken, isAdmin], async (req, res) => {
    const { id } = req.params;
    try {
        const userWithShift = await User.findOne({ shiftGroup: id });
        if (userWithShift) {
            return res.status(400).json({error: "Cannot delete shift as it is currently assigned to one or more employees."});
        }
        const deletedShift = await Shift.findByIdAndDelete(id);
        if (!deletedShift) { return res.status(404).json({ error: "Shift not found." }); }
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting shift:', err);
        res.status(500).json({error: 'Failed to delete shift.'});
    }
});

module.exports = router;