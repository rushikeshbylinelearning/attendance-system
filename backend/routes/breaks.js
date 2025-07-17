// backend/routes/breaks.js

const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/start', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { breakType } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    if (!breakType || !['Paid', 'Unpaid'].includes(breakType)) {
        return res.status(400).json({ error: 'A valid break type (Paid or Unpaid) is required.' });
    }

    try {
        const logResult = await db.query('SELECT id FROM attendance_log WHERE employee_id = $1 AND attendance_date = $2', [userId, today]);
        if (logResult.rows.length === 0) return res.status(400).json({ error: 'You must be clocked in to start a break.' });
        const attendanceLogId = logResult.rows[0].id;

        // ... (active session and active break checks remain the same) ...
        const activeSessionResult = await db.query('SELECT id FROM attendance_sessions WHERE attendance_log_id = $1 AND end_time IS NULL', [attendanceLogId]);
        if (activeSessionResult.rows.length === 0) return res.status(400).json({ error: 'You must be in an active work session to start a break.' });
        const activeBreakResult = await db.query('SELECT id FROM break_log WHERE attendance_log_id = $1 AND end_time IS NULL', [attendanceLogId]);
        if (activeBreakResult.rows.length > 0) return res.status(400).json({ error: 'You are already on a break.' });

        // ** NEW & CORRECTED BUSINESS RULE ENFORCEMENT **
        if (breakType === 'Paid') {
            // Get the user's paid break allowance from their shift
            const shiftInfo = await db.query('SELECT sm.paid_break_minutes FROM employee_master em JOIN shift_master sm ON em.shift_group_id = sm.id WHERE em.id = $1', [userId]);
            const paidBreakAllowance = shiftInfo.rows[0]?.paid_break_minutes || 30;

            // Get the total duration of completed paid breaks today
            const paidBreaksResult = await db.query(
                `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM break_log WHERE attendance_log_id = $1 AND break_type = 'Paid' AND end_time IS NOT NULL`,
                [attendanceLogId]
            );
            const paidMinutesAlreadyTaken = parseInt(paidBreaksResult.rows[0].total, 10);

            if (paidMinutesAlreadyTaken >= paidBreakAllowance) {
                return res.status(403).json({ error: 'You have already used all your paid break time for the day.' });
            }
        }

        if (breakType === 'Unpaid') {
            const unpaidBreaksResult = await db.query(`SELECT COUNT(*) as count FROM break_log WHERE attendance_log_id = $1 AND break_type = 'Unpaid'`, [attendanceLogId]);
            const unpaidBreaksCount = parseInt(unpaidBreaksResult.rows[0].count, 10);
            const UNPAID_BREAK_LIMIT = 1;
            if (unpaidBreaksCount >= UNPAID_BREAK_LIMIT) {
                return res.status(403).json({ error: `You have already taken the maximum of ${UNPAID_BREAK_LIMIT} unpaid break(s).` });
            }
        }

        const newBreak = await db.query('INSERT INTO break_log (attendance_log_id, start_time, break_type) VALUES ($1, NOW(), $2) RETURNING *', [attendanceLogId, breakType]);
        res.status(201).json({ message: 'Break started successfully.', break: newBreak.rows[0] });

    } catch (error) {
        console.error('Start Break Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/breaks/end
router.post('/end', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const today = new Date().toISOString().slice(0, 10);

    try {
        // 1. Find the attendance log to get its ID.
        const logResult = await db.query(
            'SELECT id FROM attendance_log WHERE employee_id = $1 AND attendance_date = $2',
            [userId, today]
        );
        if (logResult.rows.length === 0) {
            return res.status(400).json({ error: 'Cannot find attendance log for today.' });
        }
        const attendanceLogId = logResult.rows[0].id;

        // 2. Find the active break for that log.
        const activeBreakResult = await db.query(
            'SELECT id, start_time FROM break_log WHERE attendance_log_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1',
            [attendanceLogId]
        );

        if (activeBreakResult.rows.length === 0) {
            return res.status(400).json({ error: 'You are not currently on a break.' });
        }
        const activeBreakId = activeBreakResult.rows[0].id;
        
        const shiftInfoResult = await db.query(
    `SELECT sm.paid_break_minutes 
     FROM employee_master em
     JOIN shift_master sm ON em.shift_group_id = sm.id
     WHERE em.id = $1`,
    [userId]
);
const paidBreakAllowance = shiftInfoResult.rows[0]?.paid_break_minutes || 30; // Default to 30 if not found

// 4. Get the sum of all 'Paid' breaks already taken today
const paidBreaksToday = await db.query(
    `SELECT COALESCE(SUM(duration_minutes), 0) as total 
     FROM break_log 
     WHERE attendance_log_id = $1 AND break_type = 'Paid'`,
    [attendanceLogId]
);
const paidMinutesAlreadyTaken = parseInt(paidBreaksToday.rows[0].total, 10);

// 5. Update the break and calculate its duration
const breakEndTime = new Date();
const breakStartTime = new Date(activeBreakResult.rows[0].start_time);
const currentBreakDuration = Math.round((breakEndTime - breakStartTime) / (1000 * 60)); // Duration in minutes

// 6. Classify the break as 'Paid' or 'Unpaid'
let breakType = 'Unpaid';
let penalty = 0;
const remainingPaidAllowance = paidBreakAllowance - paidMinutesAlreadyTaken;

if (remainingPaidAllowance > 0) {
    breakType = 'Paid';
    // If this paid break exceeds the remaining allowance, it creates a penalty
    if (currentBreakDuration > remainingPaidAllowance) {
        penalty = currentBreakDuration - remainingPaidAllowance;
    }
} else {
    // No paid allowance left, the entire break duration is a penalty
    penalty = currentBreakDuration;
}

// 7. Update the break_log table with the new info
const updatedBreak = await db.query(`
    UPDATE break_log
    SET
        end_time = $1,
        duration_minutes = $2,
        break_type = $3
    WHERE id = $4
    RETURNING *;
`, [breakEndTime, currentBreakDuration, breakType, activeBreakId]);

// 8. Update the main attendance_log with the new penalty minutes
if (penalty > 0) {
    await db.query(
        'UPDATE attendance_log SET penalty_minutes = penalty_minutes + $1 WHERE id = $2',
        [penalty, attendanceLogId]
    );
}

        res.json({ message: 'Break ended successfully.', break: updatedBreak.rows[0] });

    } catch (error) {
        console.error('End Break Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;