const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Please enter all fields' });
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        const newUser_data = { name, email, password };
        if (role && ['admin', 'technician', 'employee'].includes(role)) {
            newUser_data.role = role;
        }
        user = new User(newUser_data);
        await user.save();
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error('REGISTRATION ERROR:', err.message);
        res.status(500).send('Server error');
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    // 1. Get email, password, AND loginType from the request body
    const { email, password, loginType } = req.body;

    if (!email || !password || !loginType) {
        return res.status(400).json({ msg: 'Please provide email, password, and login type.' });
    }
    
    // 2. Define the allowed roles for each login type
    const allowedRoles = {
        admin: ['admin', 'technician'], // Admins and Techs use the admin login page
        employee: ['employee']          // Employees use the employee login page
    };

    if (!allowedRoles[loginType]) {
        return res.status(400).json({ msg: 'Invalid login type specified.' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        
        // 3. Check if the user's role is allowed for this login page
        if (!allowedRoles[loginType].includes(user.role)) {
            // This is a key security check. An employee can't log in through the admin page.
            return res.status(403).json({ msg: 'Access denied for this login portal.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        console.error('LOGIN ERROR:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
