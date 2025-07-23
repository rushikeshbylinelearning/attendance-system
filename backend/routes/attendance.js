// backend/routes/attendance.js
// --- THIS FILE IS CORRECTED ---

const express = require('express');
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const AttendanceSession = require('../models/AttendanceSession');
const BreakLog = require('../models/BreakLog');

const router = express.Router();

// NOTE: The getOrCreateAttendanceLog helper function has been removed as its logic
// was too simple and caused the validation error. The correct, more detailed logic
// is now built directly into the /clock-in route.


// GET /api/attendance/status (Your code, no changes needed)
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        const today = new Date().toISOString().slice(0, 10);

        const user = await User.findById(userId).populate('shiftGroup').lean();
        if (!user || !user.shiftGroup) {
            // Note: Frontend will show 'Not Clocked In' which is reasonable.
            return res.json({ status: 'Not Clocked In', sessions: [], breaks: [], calculatedLogoutTime: null, shift: null });
        }

        const attendanceLog = await AttendanceLog.findOne({ user: userId, attendanceDate: today });
        if (!attendanceLog) {
            return res.json({ status: 'Not Clocked In', sessions: [], breaks: [], calculatedLogoutTime: null, shift: user.shiftGroup });
        }
        
        const sessions = await AttendanceSession.find({ attendanceLog: attendanceLog._id }).sort({ startTime: 1 }).lean();
        const breaks = await BreakLog.find({ attendanceLog: attendanceLog._id }).sort({ startTime: 1 }).lean();
        
        const firstClockInSession = sessions.length > 0 ? sessions[0] : null;

        const hasActiveSession = sessions.some(s => !s.endTime);
        const hasActiveBreak = breaks.some(b => !b.endTime);
        let currentStatus = 'Not Clocked In';
        if (hasActiveBreak) currentStatus = 'On Break';
        else if (hasActiveSession) currentStatus = 'Clocked In';
        else if (sessions.length > 0) currentStatus = 'Clocked Out';
        
        let calculatedLogoutTime = null;
        const shift = user.shiftGroup;
        const breakPenaltyMinutes = attendanceLog.penaltyMinutes || 0;

        if (firstClockInSession) {
            const clockInTime = new Date(firstClockInSession.startTime);
            if (shift.shiftType === 'Fixed' && shift.startTime && shift.endTime) {
                const [startH, startM] = shift.startTime.split(':').map(Number);
                const shiftStartTime = new Date(clockInTime);
                shiftStartTime.setHours(startH, startM, 0, 0);

                const [endH, endM] = shift.endTime.split(':').map(Number);
                const baseLogoutTime = new Date(clockInTime);
                baseLogoutTime.setHours(endH, endM, 0, 0);
                if (baseLogoutTime < shiftStartTime) baseLogoutTime.setDate(baseLogoutTime.getDate() + 1);

                let latenessPenalty = 0;
                if (clockInTime > shiftStartTime) {
                    latenessPenalty = Math.round((clockInTime - shiftStartTime) / (1000 * 60));
                }
                const totalPenalty = latenessPenalty + breakPenaltyMinutes;
                baseLogoutTime.setMinutes(baseLogoutTime.getMinutes() + totalPenalty);
                calculatedLogoutTime = baseLogoutTime.toISOString();
            }
            else if (shift.shiftType === 'Flexible' && shift.durationHours) {
                const requiredWorkMinutes = (shift.durationHours * 60);
                const requiredLogoutTime = new Date(clockInTime);
                requiredLogoutTime.setMinutes(requiredLogoutTime.getMinutes() + requiredWorkMinutes + breakPenaltyMinutes);
                calculatedLogoutTime = requiredLogoutTime.toISOString();
            }
        }
        
        res.json({ status: currentStatus, sessions, breaks, calculatedLogoutTime, shift: user.shiftGroup });

    } catch (error) {
        console.error("Error fetching status:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// =======================================================================
// START: CORRECTED /clock-in ROUTE
// =======================================================================
router.post('/clock-in', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
        // Step 1: Find the user and populate their assigned shift information
        const user = await User.findById(userId).populate('shiftGroup');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        // Step 2: Ensure the user has a shift assigned
        if (!user.shiftGroup) {
            return res.status(400).json({ error: 'Cannot clock in. You have no shift assigned.' });
        }
        
        // Step 3: Find today's attendance log, if it exists
        let attendanceLog = await AttendanceLog.findOne({ user: userId, attendanceDate: todayStr });

        // Step 4: If no log exists for today, create one with all required fields
        if (!attendanceLog) {
            attendanceLog = await AttendanceLog.create({
                user: userId,
                attendanceDate: todayStr,
                // --- PROVIDE THE REQUIRED FIELDS ---
                clockInTime: new Date(),
                shiftDurationMinutes: user.shiftGroup.durationHours * 60,
                // Set defaults for other fields if necessary
                penaltyMinutes: 0,
                paidBreakMinutesTaken: 0,
            });
        }
        
        // Step 5: Check for an already active (not ended) session to prevent duplicates
        const activeSession = await AttendanceSession.findOne({ attendanceLog: attendanceLog._id, endTime: null });
        if (activeSession) {
            return res.status(400).json({ error: 'You are already clocked in.' });
        }

        // Step 6: Create the new attendance session linked to the log
        const newSession = await AttendanceSession.create({ 
            attendanceLog: attendanceLog._id, 
            startTime: new Date() 
        });

        res.status(201).json({ message: 'Clocked in successfully!', session: newSession });

    } catch (error) {
        // This will catch any errors, including Mongoose validation errors
        console.error('Clock-in Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// =======================================================================
// END: CORRECTED /clock-in ROUTE
// =======================================================================


// POST /api/attendance/clock-out (Your code, no changes needed)
router.post('/clock-out', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const today = new Date().toISOString().slice(0, 10);
    try {
        const log = await AttendanceLog.findOne({ user: userId, attendanceDate: today });
        if (!log) return res.status(400).json({ error: 'Cannot find attendance log. You must clock in first.' });
        
        const activeBreak = await BreakLog.findOne({ attendanceLog: log._id, endTime: null });
        if (activeBreak) return res.status(400).json({ error: 'You must end your break before clocking out.' });

        const updatedSession = await AttendanceSession.findOneAndUpdate(
            { attendanceLog: log._id, endTime: null },
            { $set: { endTime: new Date() } },
            { new: true, sort: { startTime: -1 } }
        );

        if (!updatedSession) return res.status(400).json({ error: 'You are not currently clocked in.' });

        // Also update the main log's clockOutTime
        await AttendanceLog.findByIdAndUpdate(log._id, { $set: { clockOutTime: new Date() } });
        
        res.json({ message: 'Clocked out successfully!', session: updatedSession });
    } catch (error) {
        console.error('Clock-out Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET /api/attendance/my-weekly-log (Your code, no changes needed)
router.get('/my-weekly-log', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID." });
        }

        let { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            const today = new Date();
            const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - dayOfWeek));
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
            startDate = firstDayOfWeek.toISOString().slice(0, 10);
            endDate = lastDayOfWeek.toISOString().slice(0, 10);
        }
    
        const logs = await AttendanceLog.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    attendanceDate: { $gte: startDate, $lte: endDate }
                }
            },
            { $lookup: { from: 'attendancesessions', localField: '_id', foreignField: 'attendanceLog', as: 'sessions' } },
            { $lookup: { from: 'breaklogs', localField: '_id', foreignField: 'attendanceLog', as: 'breaks' } },
            {
                $project: {
                    _id: 1,
                    attendanceDate: 1,
                    status: 1,
                    clockInTime: 1,
                    clockOutTime: 1,
                    sessions: {
                        $map: {
                            input: "$sessions", as: "s",
                            in: { startTime: "$$s.startTime", endTime: "$$s.endTime" }
                        }
                    },
                    breaks: {
                         $map: {
                            input: "$breaks", as: "b",
                            in: { startTime: "$$b.startTime", endTime: "$$b.endTime", duration: "$$b.durationMinutes", type: "$$b.breakType" }
                        }
                    }
                }
            },
            { $sort: { attendanceDate: 1 } }
        ]);
        res.json(logs);
    } catch (error) {
        console.error("Error fetching weekly log:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;