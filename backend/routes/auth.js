const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role, employeecode, seatNumber } = req.body;

    if (!name || !email || !password || !employeecode) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // 🔐 Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser_data = {
            name,
            email,
            password: hashedPassword, // ✅ Store hashed password
            employeecode
        };

        if (seatNumber) newUser_data.seatNumber = seatNumber;
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
    const { email, password, loginType } = req.body;

    console.log('🔐 Login attempt:', { email, loginType });

    if (!email || !password || !loginType) {
        console.warn('⚠️ Missing login fields');
        return res.status(400).json({ msg: 'Please provide email, password, and login type.' });
    }

    const allowedRoles = {
        admin: ['admin', 'technician'],
        employee: ['employee']
    };

    if (!allowedRoles[loginType]) {
        console.warn('❌ Invalid login type:', loginType);
        return res.status(400).json({ msg: 'Invalid login type specified.' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.warn('❌ No user found for email:', email);
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        console.log('✅ Found user:', { role: user.role, email: user.email });

        if (!allowedRoles[loginType].includes(user.role)) {
            console.warn(`⛔ Role mismatch. Tried to login as ${loginType}, but user is ${user.role}`);
            return res.status(403).json({ msg: 'Access denied for this login portal.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.warn('❌ Password does not match for', email);
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        console.log('✅ Login success for', email);
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error('🚨 LOGIN ERROR:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
