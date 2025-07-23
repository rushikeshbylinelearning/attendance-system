// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/authenticateToken');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email/Employee Code and password are required.' });
    }

    try {
        const user = await User.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${email}$`, 'i') } }, 
                { employeeCode: { $regex: new RegExp(`^${email}$`, 'i') } }
            ],
            isActive: true,
        }).populate('shiftGroup');

        if (!user || !user.passwordHash) {
            console.warn(`Login attempt failed for: ${email}. User not found or has no password.`);
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const payload = { userId: user._id, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role,
                // --- FIX: Add the missing field to the response ---
                alternateSaturdayPolicy: user.alternateSaturdayPolicy,
                shift: user.shiftGroup ? {
                    id: user.shiftGroup._id,
                    name: user.shiftGroup.shiftName,
                    startTime: user.shiftGroup.startTime,
                    endTime: user.shiftGroup.endTime,
                    duration: user.shiftGroup.durationHours,
                    paidBreak: user.shiftGroup.paidBreakMinutes,
                } : null
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('shiftGroup').select('-passwordHash');
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({
            id: user._id,
            name: user.fullName,
            email: user.email,
            role: user.role,
            // --- FIX: Add the missing field to the response ---
            alternateSaturdayPolicy: user.alternateSaturdayPolicy,
            shift: user.shiftGroup ? {
                id: user.shiftGroup._id,
                name: user.shiftGroup.shiftName,
                startTime: user.shiftGroup.startTime,
                endTime: user.shiftGroup.endTime,
                duration: user.shiftGroup.durationHours,
                paidBreak: user.shiftGroup.paidBreakMinutes,
            } : null
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;