// backend/routes/shifts.js
const express = require('express');
const db = require('../db');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access forbidden: Requires Admin role.' });
    }
    next();
};

// GET all shifts
router.get('/', [authenticateToken, isAdmin], async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shift_master ORDER BY shift_name');
        res.json(result.rows);
    } catch (err) { res.status(500).json({error: 'Failed to fetch shifts.'}); }
});

// POST a new shift
router.post('/', [authenticateToken, isAdmin], async (req, res) => {
    const { shift_name, start_time, end_time, duration_hours, paid_break_minutes, shift_type } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO shift_master (shift_name, start_time, end_time, duration_hours, paid_break_minutes, shift_type)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [shift_name, start_time || null, end_time || null, duration_hours, paid_break_minutes, shift_type]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({error: 'Failed to create shift.'}); }
});

// PUT (update) a shift
router.put('/:id', [authenticateToken, isAdmin], async (req, res) => {
    const { id } = req.params;
    const { shift_name, start_time, end_time, duration_hours, paid_break_minutes, shift_type } = req.body;
    try {
        const result = await db.query(
            `UPDATE shift_master SET shift_name = $1, start_time = $2, end_time = $3, duration_hours = $4, paid_break_minutes = $5, shift_type = $6
             WHERE id = $7 RETURNING *`,
            [shift_name, start_time || null, end_time || null, duration_hours, paid_break_minutes, shift_type, id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({error: 'Failed to update shift.'}); }
});

// DELETE a shift
router.delete('/:id', [authenticateToken, isAdmin], async (req, res) => {
    const { id } = req.params;
    // Check if shift is in use
    const inUse = await db.query('SELECT 1 FROM employee_master WHERE shift_group_id = $1 LIMIT 1', [id]);
    if (inUse.rows.length > 0) {
        return res.status(400).json({error: "Cannot delete shift as it is currently assigned to one or more employees."});
    }
    try {
        await db.query('DELETE FROM shift_master WHERE id = $1', [id]);
        res.status(204).send(); // No Content
    } catch (err) { res.status(500).json({error: 'Failed to delete shift.'}); }
});

module.exports = router;