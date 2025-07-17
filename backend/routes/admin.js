// backend/routes/admin.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

const SALT_ROUNDS = 10;

// Middleware to check for Admin/HR role
const isAdminOrHr = (req, res, next) => {
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
        return res.status(403).json({ error: 'Access forbidden: Requires Admin or HR role.' });
    }
    next();
};

// GET /api/admin/employees - List all employees for the main table and selectors
router.get('/employees', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const query = `
            SELECT 
                em.id, em.employee_code, em.full_name, em.email, em.role, 
                em.designation, em.department, em.joining_date, em.is_active,
                sm.shift_name, em.shift_group_id
            FROM employee_master em
            LEFT JOIN shift_master sm ON em.shift_group_id = sm.id
            ORDER BY em.full_name;
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// GET /api/admin/shifts - Simple list of shifts for the form dropdown
router.get('/shifts', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const result = await db.query('SELECT id, shift_name FROM shift_master ORDER BY shift_name');
        res.json(result.rows);
    } catch (error) {
        console.error('Failed to fetch shifts:', error);
        res.status(500).json({ error: 'Failed to fetch shifts' });
    }
});

// GET /api/admin/dashboard-summary - Fetches live stats for the admin homepage
router.get('/dashboard-summary', [authenticateToken, isAdminOrHr], async (req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
        const query = `
            WITH TodayLogs AS (SELECT employee_id, status FROM attendance_log WHERE attendance_date = $1),
            WhosIn AS (
                SELECT em.id, em.full_name, em.designation, s.start_time
                FROM attendance_sessions s
                JOIN attendance_log al ON s.attendance_log_id = al.id
                JOIN employee_master em ON al.employee_id = em.id
                WHERE al.attendance_date = $1 AND s.end_time IS NULL ORDER BY s.start_time
            )
            SELECT
                (SELECT COUNT(*) FROM employee_master WHERE is_active = TRUE) as total_employees,
                (SELECT COUNT(*) FROM TodayLogs WHERE status = 'Present' OR status = 'Late') as present_count,
                (SELECT COUNT(*) FROM TodayLogs WHERE status = 'Late') as late_count,
                (SELECT COUNT(*) FROM TodayLogs WHERE status = 'On Leave') as on_leave_count,
                (SELECT json_agg(t) FROM WhosIn t) as whos_in_list
        `;
        const result = await db.query(query, [today]);
        const summary = result.rows[0];
        if (!summary.whos_in_list) { summary.whos_in_list = []; }
        res.json(summary);
    } catch (error) {
        console.error("Error fetching dashboard summary:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// GET /api/admin/attendance-logs - The robust endpoint for viewing detailed logs
router.get('/attendance-logs', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { employeeId, startDate, endDate } = req.query;
    if (!employeeId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Employee ID, start date, and end date are required.' });
    }
    try {
        const query = `
            SELECT
                al.id,
                al.attendance_date,
                al.status,
                json_agg(DISTINCT jsonb_build_object('start_time', ass.start_time, 'end_time', ass.end_time)) FILTER (WHERE ass.id IS NOT NULL) AS sessions,
                (
                    SELECT json_agg(b ORDER BY b.start_time)
                    FROM (
                        SELECT bl.start_time, bl.end_time, bl.duration_minutes, bl.break_type
                        FROM break_log bl
                        WHERE bl.attendance_log_id = al.id
                    ) b
                ) AS breaks
            FROM attendance_log al
            LEFT JOIN attendance_sessions ass ON al.id = ass.attendance_log_id
            WHERE al.employee_id = $1 AND al.attendance_date BETWEEN $2 AND $3
            GROUP BY al.id, al.attendance_date, al.status
            ORDER BY al.attendance_date DESC;
        `;
        const result = await db.query(query, [employeeId, startDate, endDate]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching admin attendance logs:', error);
        res.status(500).json({ error: 'Internal server error while fetching logs.' });
    }
});

// POST /api/admin/employees - Create a new employee
router.post('/employees', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { employee_code, full_name, email, password, role, designation, department, joining_date, shift_group_id } = req.body;
    if (!employee_code || !full_name || !email || !password) {
        return res.status(400).json({ error: 'Employee Code, Name, Email, and Password are required.' });
    }
    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const query = `INSERT INTO employee_master (employee_code, full_name, email, password_hash, role, designation, department, joining_date, shift_group_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`;
        const values = [employee_code, full_name, email, password_hash, role, designation, department, joining_date, shift_group_id];
        await db.query(query, values);
        res.status(201).json({ message: 'Employee created successfully!' });
    } catch (error) {
        if (error.code === '23505') { return res.status(409).json({ error: 'Employee with this email or code already exists.' });}
        console.error('Create Employee Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/employees/:id - Update an existing employee
router.put('/employees/:id', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { id } = req.params;
    const { employee_code, full_name, email, role, designation, department, joining_date, shift_group_id, is_active } = req.body;
    try {
        const query = `UPDATE employee_master SET employee_code = $1, full_name = $2, email = $3, role = $4, designation = $5, department = $6, joining_date = $7, shift_group_id = $8, is_active = $9 WHERE id = $10`;
        const values = [employee_code, full_name, email, role, designation, department, joining_date, shift_group_id, is_active, id];
        const result = await db.query(query, values);
        if (result.rowCount === 0) { return res.status(404).json({ error: 'Employee not found.' });}
        res.json({ message: 'Employee updated successfully.' });
    } catch (error)
    {
        if (error.code === '23505') { return res.status(409).json({ error: 'Employee with this email or code already exists.' });}
        console.error('Update Employee Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/employees/:id/shift', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { id } = req.params;
    const { shift_group_id } = req.body;

    if (!shift_group_id) {
        return res.status(400).json({ error: 'shift_group_id is required.' });
    }

    try {
        const result = await db.query(
            'UPDATE employee_master SET shift_group_id = $1 WHERE id = $2 RETURNING id, shift_group_id',
            [shift_group_id, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Employee not found.' });
        }
        res.json({ message: 'Employee shift updated successfully.' });

    } catch (error) {
        console.error("Error updating employee shift:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;