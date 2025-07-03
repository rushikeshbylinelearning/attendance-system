// routes/admin.js or routes/setup.js
const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Utility to convert name to email and username
function generateEmailAndUsername(name) {
    const base = name.trim().toLowerCase().replace(/\s+/g, '.');
    return {
        username: base,
        email: `${base}@company.com`
    };
}

router.post('/admin/generate-users-from-allocations', async (req, res) => {
    try {
        const allocations = await Allocation.find();
        const uniqueNames = new Set();

        for (const alloc of allocations) {
            const name = alloc['Employee Name']?.trim();
            if (!name || uniqueNames.has(name)) continue;
            uniqueNames.add(name);

            const { username, email } = generateEmailAndUsername(name);
            const defaultPassword = name.split(' ')[0].toLowerCase() + '123';

            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            await User.create({
                name,
                email,
                username,
                password: hashedPassword,
                role: 'employee'
            });

            console.log(`Created user: ${email}`);
        }

        res.status(200).json({ msg: 'Users created from allocations successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error generating users' });
    }
});
