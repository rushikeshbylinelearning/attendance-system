const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// --- Middleware ---
const authenticateToken = require('../middleware/authenticateToken');

// --- Models ---
const User = require('../models/User');
const AttendanceLog = require('../models/AttendanceLog');
const AttendanceSession = require('../models/AttendanceSession');
const LeaveRequest = require('../models/LeaveRequest');

// Middleware to check for Admin/HR role
const isAdminOrHr = (req, res, next) => {
    if (!['Admin', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access forbidden: Requires Admin or HR role.' });
    }
    next();
};

// ===================================
// NEW & EXPANDED LEAVE MANAGEMENT (for Admin Page)
// ===================================

// GET /api/admin/leaves/all - Get ALL leave requests for the management page
router.get('/leaves/all', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const allRequests = await LeaveRequest.find({})
            .populate('employee', 'fullName employeeCode')
            .sort({ createdAt: -1 }); // Show newest first
        res.json(allRequests);
    } catch (error) {
        console.error('Error fetching all leave requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests.' });
    }
});

// POST /api/admin/leaves - Create a leave request on behalf of an employee
router.post('/leaves', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const newRequest = new LeaveRequest(req.body);
        await newRequest.save();
        res.status(201).json({ message: 'Leave request created successfully.', request: newRequest });
    } catch (error) {
        console.error('Error creating leave request by admin:', error);
        res.status(500).json({ error: 'Failed to create leave request.' });
    }
});

// PUT /api/admin/leaves/:id - Update any detail of a leave request
router.put('/leaves/:id', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const updatedRequest = await LeaveRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRequest) {
            return res.status(404).json({ error: 'Request not found.' });
        }
        res.json({ message: 'Request updated successfully.', request: updatedRequest });
    } catch (error) {
        console.error('Error updating leave request by admin:', error);
        res.status(500).json({ error: 'Failed to update request.' });
    }
});

// DELETE /api/admin/leaves/:id - Delete a leave request
router.delete('/leaves/:id', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const deletedRequest = await LeaveRequest.findByIdAndDelete(req.params.id);
        if (!deletedRequest) {
            return res.status(404).json({ error: 'Request not found.' });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting leave request by admin:', error);
        res.status(500).json({ error: 'Failed to delete request.' });
    }
});


// ===================================
// LEAVE MANAGEMENT (for Dashboard Widget)
// ===================================

// GET /api/admin/leaves/pending - Get all pending leave requests
router.get('/leaves/pending', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const pendingRequests = await LeaveRequest.find({ status: 'Pending' })
            .populate('employee', 'fullName employeeCode')
            .sort({ createdAt: 1 });
        res.json(pendingRequests);
    } catch (error) {
        console.error('Error fetching pending leave requests:', error);
        res.status(500).json({ error: 'Failed to fetch pending requests.' });
    }
});

// PATCH /api/admin/leaves/:id/status - Approve or reject a request
router.patch('/leaves/:id/status', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expects 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
    }

    try {
        const updatedRequest = await LeaveRequest.findByIdAndUpdate(
            id,
            {
                status,
                approvedBy: req.user.userId,
                approvedAt: new Date(),
            },
            { new: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ error: 'Request not found.' });
        }
        res.json({ message: `Request has been ${status.toLowerCase()}.`, request: updatedRequest });
    } catch (error) {
        console.error(`Error updating request status for ID ${id}:`, error);
        res.status(500).json({ error: 'Failed to update request status.' });
    }
});


// ===================================
// DASHBOARD & LOGS (Existing routes)
// ===================================

// GET /api/admin/dashboard-summary
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

// GET /api/admin/attendance-logs
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


// GET /api/admin/bulk-attendance-logs
router.get('/bulk-attendance-logs', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'A valid date range is required.' });
    }

    try {
        const logs = await AttendanceLog.aggregate([
            { $match: { attendanceDate: { $gte: startDate, $lte: endDate } } },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'shifts',
                    localField: 'user.shiftGroup',
                    foreignField: '_id',
                    as: 'user.shiftGroup'
                }
            },
            { $unwind: { path: '$user.shiftGroup', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'attendancesessions', localField: '_id', foreignField: 'attendanceLog', as: 'sessions' } },
            { $lookup: { from: 'breaklogs', localField: '_id', foreignField: 'attendanceLog', as: 'breaks' } },
            { $addFields: { totalBreakMinutes: { $sum: '$breaks.durationMinutes' } } },
            { $sort: { attendanceDate: 1, 'user.fullName': 1 } }
        ]);

        res.json(logs);
    } catch (error) {
        console.error('Bulk log fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch bulk logs.' });
    }
});


module.exports = router;