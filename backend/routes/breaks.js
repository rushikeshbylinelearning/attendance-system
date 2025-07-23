// backend/routes/breaks.js

const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const AttendanceSession = require('../models/AttendanceSession');
const BreakLog = require('../models/BreakLog');

const router = express.Router();

const MAX_BREAKS_PER_DAY = 3;

// ... The '/start' route remains unchanged from the previous version ...
router.post('/start', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { breakType } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    if (!breakType || !['Paid', 'Unpaid'].includes(breakType)) {
        return res.status(400).json({ error: 'A valid break type (Paid or Unpaid) is required.' });
    }

    try {
        const log = await AttendanceLog.findOne({ user: userId, attendanceDate: today });
        if (!log) return res.status(400).json({ error: 'You must be clocked in to start a break.' });
        const attendanceLogId = log._id;

        const activeSession = await AttendanceSession.findOne({ attendanceLog: attendanceLogId, endTime: null });
        if (!activeSession) return res.status(400).json({ error: 'You must be in an active work session to start a break.' });

        const activeBreak = await BreakLog.findOne({ attendanceLog: attendanceLogId, endTime: null });
        if (activeBreak) return res.status(400).json({ error: 'You are already on a break.' });

        const breaksTakenToday = await BreakLog.countDocuments({ attendanceLog: attendanceLogId });
        const isPenaltyBreak = breaksTakenToday >= MAX_BREAKS_PER_DAY;

        if (!isPenaltyBreak && breakType === 'Paid') {
            const user = await User.findById(userId).populate('shiftGroup');
            const paidBreakAllowance = user?.shiftGroup?.paidBreakMinutes || 30;
            const paidMinutesAlreadyTaken = (await BreakLog.find({ attendanceLog: attendanceLogId, breakType: 'Paid', endTime: { $ne: null } })).reduce((sum, b) => sum + b.durationMinutes, 0);
            if (paidMinutesAlreadyTaken >= paidBreakAllowance) {
                return res.status(403).json({ error: `You have used all your paid break time. You can take an Unpaid break if you are within the ${MAX_BREAKS_PER_DAY} break limit.` });
            }
        }

        const newBreak = await BreakLog.create({
            attendanceLog: attendanceLogId,
            startTime: new Date(),
            breakType,
            isPenalty: isPenaltyBreak
        });

        const message = isPenaltyBreak
            ? `Break started. WARNING: You have exceeded the daily limit of ${MAX_BREAKS_PER_DAY} breaks. This break's duration will be added to your shift time.`
            : 'Break started successfully.';
            
        res.status(201).json({ message, break: newBreak });

    } catch (error) {
        console.error('Start Break Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// POST /api/breaks/end - UPDATED
router.post('/end', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const today = new Date().toISOString().slice(0, 10);

    try {
        const log = await AttendanceLog.findOne({ user: userId, attendanceDate: today });
        if (!log) return res.status(400).json({ error: 'Cannot find attendance log for today.' });
        const attendanceLogId = log._id;

        const activeBreak = await BreakLog.findOne({ attendanceLog: attendanceLogId, endTime: null }).sort({ startTime: -1 });
        if (!activeBreak) return res.status(400).json({ error: 'You are not currently on a break.' });
        
        const breakEndTime = new Date();
        const currentBreakDuration = Math.round((breakEndTime - new Date(activeBreak.startTime)) / (1000 * 60));

        let penalty = 0;

        if (activeBreak.isPenalty) {
            penalty = currentBreakDuration;
        } else if (activeBreak.breakType === 'Paid') {
            const user = await User.findById(userId).populate('shiftGroup');
            const paidBreakAllowance = user?.shiftGroup?.paidBreakMinutes || 30;
            const completedPaidBreaks = await BreakLog.find({
                attendanceLog: attendanceLogId,
                breakType: 'Paid',
                endTime: { $ne: null },
                _id: { $ne: activeBreak._id }
            });
            const paidMinutesAlreadyTaken = completedPaidBreaks.reduce((sum, b) => sum + b.durationMinutes, 0);
            const remainingPaidAllowance = paidBreakAllowance - paidMinutesAlreadyTaken;
            if (currentBreakDuration > remainingPaidAllowance) {
                penalty = currentBreakDuration - Math.max(0, remainingPaidAllowance);
            }
        }

        const updatedBreak = await BreakLog.findByIdAndUpdate(activeBreak._id, {
            $set: {
                endTime: breakEndTime,
                durationMinutes: currentBreakDuration,
            }
        }, { new: true });
        
        // --- NEW: Update the main attendance log with penalties and paid break time ---
        const updatePayload = { $inc: {} };
        if (penalty > 0) {
            updatePayload.$inc.penaltyMinutes = penalty;
        }
        // If it was a regular Paid break, add its duration to the running total.
        if (updatedBreak.breakType === 'Paid' && !updatedBreak.isPenalty) {
             updatePayload.$inc.paidBreakMinutesTaken = updatedBreak.durationMinutes;
        }

        // Only run the update if there's something to change.
        if (Object.keys(updatePayload.$inc).length > 0) {
            await AttendanceLog.findByIdAndUpdate(attendanceLogId, updatePayload);
        }

        res.json({ message: 'Break ended successfully.', break: updatedBreak });

    } catch (error) {
        console.error('End Break Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;