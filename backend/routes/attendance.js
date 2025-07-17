// backend/routes/attendance.js

const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

// Helper to get or create today's attendance log
async function getOrCreateAttendanceLog(employeeId, date) {
    let logResult = await db.query('SELECT id FROM attendance_log WHERE employee_id = $1 AND attendance_date = $2', [employeeId, date]);
    if (logResult.rows.length > 0) {
        return logResult.rows[0].id;
    } else {
        const newLog = await db.query(
            'INSERT INTO attendance_log (employee_id, attendance_date, status) VALUES ($1, $2, $3) RETURNING id',
            [employeeId, date, 'Present'] // We can add 'Late' logic here later
        );
        return newLog.rows[0].id;
    }
}

// GET /api/attendance/status - (FINAL, CORRECTED VERSION)
router.get('/status', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const today = new Date().toISOString().slice(0, 10);

    try {
        const query = `
            SELECT 
                al.id, al.penalty_minutes,
                sm.shift_type, sm.start_time AS shift_start_time, sm.end_time AS shift_end_time, sm.duration_hours,
                (SELECT MIN(start_time) FROM attendance_sessions WHERE attendance_log_id = al.id) as first_clock_in
            FROM employee_master em
            LEFT JOIN attendance_log al ON em.id = al.employee_id AND al.attendance_date = $2
            JOIN shift_master sm ON em.shift_group_id = sm.id
            WHERE em.id = $1
        `;
        const result = await db.query(query, [userId, today]);

        if (result.rows.length === 0 || !result.rows[0].id) {
            return res.json({ status: 'Not Clocked In', sessions: [], breaks: [], calculatedLogoutTime: null });
        }
        
        const data = result.rows[0];
        
        // ... (fetching sessions/breaks and determining status remains the same) ...
        const sessionsResult = await db.query('SELECT * FROM attendance_sessions WHERE attendance_log_id = $1 ORDER BY start_time', [data.id]);
        const breaksResult = await db.query('SELECT * FROM break_log WHERE attendance_log_id = $1 ORDER BY start_time', [data.id]);
        const hasActiveSession = sessionsResult.rows.some(s => s.end_time === null);
        const hasActiveBreak = breaksResult.rows.some(b => b.end_time === null);
        let currentStatus = hasActiveBreak ? 'On Break' : (hasActiveSession ? 'Clocked In' : 'Clocked Out');
        
        // ** NEW, CORRECTED DYNAMIC LOGOUT CALCULATION LOGIC **
        let calculatedLogoutTime = null;

        if (data.shift_type === 'Fixed' && data.shift_end_time && data.first_clock_in) {
            const requiredLogout = new Date(); // Start with today's date
            const [endH, endM, endS] = data.shift_end_time.split(':');
            requiredLogout.setHours(parseInt(endH), parseInt(endM), parseInt(endS), 0);

            // 1. Calculate lateness penalty (NO GRACE PERIOD)
            const clockInTime = new Date(data.first_clock_in);
            const shiftStartTime = new Date(); // Today's date
            const [startH, startM, startS] = data.shift_start_time.split(':');
            shiftStartTime.setHours(parseInt(startH), parseInt(startM), parseInt(startS), 0);

            let lateMinutes = 0;
            if (clockInTime > shiftStartTime) {
                lateMinutes = Math.round((clockInTime - shiftStartTime) / (1000 * 60));
            }

            // 2. Add break penalties and lateness penalties to the standard logout time
            const totalPenalty = (data.penalty_minutes || 0) + lateMinutes;
            if (totalPenalty > 0) {
                requiredLogout.setMinutes(requiredLogout.getMinutes() + totalPenalty);
            }
            calculatedLogoutTime = requiredLogout.toISOString();
        } 
        else if (data.shift_type === 'Flexible' && data.first_clock_in) {
            const requiredLogout = new Date(data.first_clock_in);
            const totalMinutesRequired = (parseFloat(data.duration_hours) * 60) + (data.penalty_minutes || 0);
            requiredLogout.setMinutes(requiredLogout.getMinutes() + totalMinutesRequired);
            calculatedLogoutTime = requiredLogout.toISOString();
        }

        res.json({ status: currentStatus, sessions: sessionsResult.rows, breaks: breaksResult.rows, calculatedLogoutTime });

    } catch (error) {
        console.error("Error fetching status:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ** THIS IS THE MISSING ROUTE HANDLER **
// POST /api/attendance/clock-in
router.post('/clock-in', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const today = new Date().toISOString().slice(0, 10);
    try {
        const attendanceLogId = await getOrCreateAttendanceLog(userId, today);
        const activeSession = await db.query('SELECT id FROM attendance_sessions WHERE attendance_log_id = $1 AND end_time IS NULL', [attendanceLogId]);
        if (activeSession.rows.length > 0) {
            return res.status(400).json({ error: 'You are already clocked in.' });
        }
        const newSession = await db.query('INSERT INTO attendance_sessions (attendance_log_id, start_time) VALUES ($1, NOW()) RETURNING *', [attendanceLogId]);
        res.status(201).json({ message: 'Clocked in successfully!', session: newSession.rows[0] });
    } catch (error) {
        console.error('Clock-in Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/attendance/clock-out
router.post('/clock-out', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const today = new Date().toISOString().slice(0, 10);
    try {
        const logResult = await db.query('SELECT id FROM attendance_log WHERE employee_id = $1 AND attendance_date = $2', [userId, today]);
        if (logResult.rows.length === 0) return res.status(400).json({ error: 'Cannot find attendance log. You must clock in first.' });
        const attendanceLogId = logResult.rows[0].id;
        const breakResult = await db.query('SELECT id FROM break_log WHERE attendance_log_id = $1 AND end_time IS NULL', [attendanceLogId]);
        if (breakResult.rows.length > 0) return res.status(400).json({ error: 'You must end your break before clocking out.' });
        const sessionResult = await db.query('UPDATE attendance_sessions SET end_time = NOW() WHERE attendance_log_id = $1 AND end_time IS NULL RETURNING *', [attendanceLogId]);
        if (sessionResult.rowCount === 0) return res.status(400).json({ error: 'You are not currently clocked in.' });
        res.json({ message: 'Clocked out successfully!', session: sessionResult.rows[0] });
    } catch (error) {
        console.error('Clock-out Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/attendance/my-weekly-log - Fetches the last 7 days of detailed logs
router.get('/my-weekly-log', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    let { startDate, endDate } = req.query;

    // If no dates are provided, default to the current week (Sun-Sat)
    if (!startDate || !endDate) {
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);

        startDate = firstDayOfWeek.toISOString().slice(0, 10);
        endDate = lastDayOfWeek.toISOString().slice(0, 10);
    }
    
    try {
        const query = `
            SELECT al.id, al.attendance_date, al.status,
                json_agg(DISTINCT jsonb_build_object('start_time', ass.start_time, 'end_time', ass.end_time)) FILTER (WHERE ass.id IS NOT NULL) AS sessions,
                (SELECT json_agg(b ORDER BY b.start_time) FROM (
                    SELECT bl.start_time, bl.end_time, bl.duration_minutes as duration, bl.break_type as type
                    FROM break_log bl WHERE bl.attendance_log_id = al.id
                ) b) AS breaks
            FROM attendance_log al
            LEFT JOIN attendance_sessions ass ON al.id = ass.attendance_log_id
            WHERE al.employee_id = $1 AND al.attendance_date BETWEEN $2 AND $3
            GROUP BY al.id, al.attendance_date, al.status ORDER BY al.attendance_date ASC;
        `;
        const result = await db.query(query, [userId, startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching weekly log:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});
module.exports = router;