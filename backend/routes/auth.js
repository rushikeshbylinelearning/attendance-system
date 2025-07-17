// backend/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Our database connection
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();
const SALT_ROUNDS = 10; // For bcrypt hashing

// ==============================
// REGISTER
// ==============================
router.post('/register', async (req, res) => {
    const {
        employee_code,
        full_name,
        email,
        password,
        role,
        joining_date,
        shift_group_id,
    } = req.body;

    if (!email || !password || !employee_code) {
        return res.status(400).json({ error: 'Email, password, and employee code are required.' });
    }

    try {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const query = `
            INSERT INTO employee_master (employee_code, full_name, email, password_hash, role, joining_date, shift_group_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, email, role;
        `;
        const values = [employee_code, full_name, email, password_hash, role, joining_date, shift_group_id];

        const result = await db.query(query, values);
        const newUser = result.rows[0];

        res.status(201).json({ message: 'User registered successfully!', user: newUser });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'User with this email or employee code already exists.' });
        }
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==============================
// LOGIN
// ==============================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const query = `
        SELECT
            em.id, em.full_name, em.email, em.password_hash, em.role,
            sm.shift_name, sm.start_time, sm.end_time, sm.duration_hours, sm.paid_break_minutes
        FROM employee_master em
        LEFT JOIN shift_master sm ON em.shift_group_id = sm.id
        WHERE em.email = $1 AND em.is_active = TRUE
    `;

    try {
        const result = await db.query(query, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', { expiresIn: '8h' });

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.role,
                shift: {
                    name: user.shift_name,
                    startTime: user.start_time,
                    endTime: user.end_time,
                    duration: user.duration_hours,
                    paidBreak: user.paid_break_minutes,
                }
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==============================
// GET CURRENT USER
// ==============================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT
                em.id, em.full_name, em.email, em.role,
                sm.shift_name, sm.start_time, sm.end_time, sm.duration_hours, sm.paid_break_minutes
            FROM employee_master em
            LEFT JOIN shift_master sm ON em.shift_group_id = sm.id
            WHERE em.id = $1
        `;

        const result = await db.query(query, [req.user.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = result.rows[0];

        res.json({
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            shift: {
                name: user.shift_name,
                startTime: user.start_time,
                endTime: user.end_time,
                duration: user.duration_hours,
                paidBreak: user.paid_break_minutes,
            }
        });

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
