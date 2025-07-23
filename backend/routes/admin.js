// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --- Middleware ---
const authenticateToken = require('../middleware/authenticateToken');

// --- Models ---
const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const AttendanceSession = require('../models/AttendanceSession');

// Middleware to check for Admin/HR role
const isAdminOrHr = (req, res, next) => {
    if (!['Admin', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access forbidden: Requires Admin or HR role.' });
    }
    next();
};

// ===================================
// DASHBOARD & LOGS
// ===================================

// GET /api/admin/dashboard-summary (No changes)
router.get('/dashboard-summary', [authenticateToken, isAdminOrHr], async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const totalEmployeesPromise = User.countDocuments({ isActive: true });
        const todayLogsPromise = AttendanceLog.find({ attendanceDate: today }).lean();
        const whosInListPromise = AttendanceSession.aggregate([
            { $match: { endTime: null } },
            { $lookup: { from: 'attendancelogs', localField: 'attendanceLog', foreignField: '_id', as: 'logInfo' } },
            { $unwind: '$logInfo' },
            { $match: { 'logInfo.attendanceDate': today } },
            { $lookup: { from: 'users', localField: 'logInfo.user', foreignField: '_id', as: 'userInfo' } },
            { $unwind: '$userInfo' },
            { $project: { _id: 0, id: '$userInfo._id', fullName: '$userInfo.fullName', designation: '$userInfo.designation', startTime: '$startTime' } },
            { $sort: { startTime: 1 } }
        ]);

        const [totalEmployees, todayLogs, whosInList] = await Promise.all([totalEmployeesPromise, todayLogsPromise, whosInListPromise]);
        
        const summary = {
            totalEmployees: totalEmployees,
            presentCount: todayLogs.length,
            lateCount: todayLogs.filter(l => l.status === 'Late').length,
            onLeaveCount: todayLogs.filter(l => l.status === 'On Leave').length,
            whosInList: whosInList || []
        };
        res.json(summary);
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// GET /api/admin/attendance-logs (No changes)
router.get('/attendance-logs', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    if (!employeeId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Employee ID, start date, and end date are required.' });
    }
    try {
        const logs = await AttendanceLog.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(employeeId), attendanceDate: { $gte: startDate, $lte: endDate } } },
            { $lookup: { from: 'attendancesessions', localField: '_id', foreignField: 'attendanceLog', as: 'sessions', pipeline: [{ $project: { startTime: 1, endTime: 1, _id: 0 } }] } },
            { $lookup: { from: 'breaklogs', localField: '_id', foreignField: 'attendanceLog', as: 'breaks', pipeline: [{ $project: { startTime: 1, endTime: 1, durationMinutes: 1, breakType: 1, _id: 0 } }] } },
            { $addFields: { totalBreakMinutes: { $sum: "$breaks.durationMinutes" } } },
            { $sort: { attendanceDate: 1 } },
            { $project: { id: '$_id', _id: 0, attendanceDate: 1, status: 1, sessions: 1, breaks: 1, totalBreakMinutes: 1 } }
        ]);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching admin attendance logs:', error);
        res.status(500).json({ error: 'Internal server error while fetching logs.' });
    }
});


// ** REWRITTEN ENDPOINT FOR BULK EXPORT **
router.get('/bulk-attendance-logs', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'A valid date range is required.' });
    }

    try {
        const logs = await AttendanceLog.aggregate([
            // 1. Filter logs by date range
            { $match: { attendanceDate: { $gte: startDate, $lte: endDate } } },
            
            // 2. Join with the users collection to get employee details
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' }, // Deconstruct the user array to an object
            
            // 3. Join with the shifts collection (nested lookup)
            {
                $lookup: {
                    from: 'shifts',
                    localField: 'user.shiftGroup',
                    foreignField: '_id',
                    as: 'user.shiftGroup'
                }
            },
            // Unwind shiftGroup but keep logs for users who have no shift assigned
            { $unwind: { path: '$user.shiftGroup', preserveNullAndEmptyArrays: true } },

            // 4. Join with sessions
            { $lookup: { from: 'attendancesessions', localField: '_id', foreignField: 'attendanceLog', as: 'sessions' } },
            
            // 5. Join with breaks
            { $lookup: { from: 'breaklogs', localField: '_id', foreignField: 'attendanceLog', as: 'breaks' } },
            
            // 6. Calculate total break time
            { $addFields: { totalBreakMinutes: { $sum: '$breaks.durationMinutes' } } },

            // 7. Sort the results
            { $sort: { attendanceDate: 1, 'user.fullName': 1 } }
        ]);

        res.json(logs);
    } catch (error) {
        console.error('Bulk log fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch bulk logs.' });
    }
});


module.exports = router;