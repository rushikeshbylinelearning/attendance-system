// backend/routes/employees.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// --- Middleware ---
const authenticateToken = require('../middleware/authenticateToken');

// --- Models ---
const User = require('../models/User');

const SALT_ROUNDS = 10;

const isAdminOrHr = (req, res, next) => {
    if (!['Admin', 'HR'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access forbidden: Requires Admin or HR role.' });
    }
    next();
};

// GET /api/admin/employees
router.get('/', [authenticateToken, isAdminOrHr], async (req, res) => {
    try {
        const employees = await User.find({}).populate('shiftGroup', 'shiftName').sort({ fullName: 1 }).lean();
        res.json(employees);
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// POST /api/admin/employees
// TEMPORARILY COMMENT OUT THE MIDDLEWARE FOR THIS STEP
router.post('/', /* [authenticateToken, isAdminOrHr], */ async (req, res) => {
    const { employeeCode, fullName, email, password, role, designation, department, joiningDate, shiftGroup, alternateSaturdayPolicy } = req.body;
    if (!employeeCode || !fullName || !email || !password) {
        return res.status(400).json({ error: 'Employee Code, Name, Email, and Password are required.' });
    }
    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = new User({ 
            employeeCode, 
            fullName, 
            email, 
            passwordHash, 
            role, 
            designation, 
            department, 
            joiningDate, 
            shiftGroup: shiftGroup || null,
            alternateSaturdayPolicy
        });
        await newUser.save();
        res.status(201).json({ message: 'Employee created successfully!' });
    } catch (error) {
        if (error.code === 11000) { return res.status(409).json({ error: 'Employee with this email or code already exists.' });}
        console.error('Create Employee Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/admin/employees/:id
router.put('/:id', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { id } = req.params;
    let { employeeCode, fullName, email, role, designation, department, joiningDate, shiftGroup, isActive, alternateSaturdayPolicy } = req.body;
    
    const updateData = { employeeCode, fullName, email, role, designation, department, joiningDate, shiftGroup: shiftGroup || null, isActive, alternateSaturdayPolicy };

    try {
        const result = await User.findByIdAndUpdate(id, updateData, { new: true });
        if (!result) { return res.status(404).json({ error: 'Employee not found.' });}
        res.json({ message: 'Employee updated successfully.' });
    } catch (error) {
        if (error.code === 11000) { return res.status(409).json({ error: 'Employee with this email or code already exists.' });}
        console.error('Update Employee Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/admin/employees/:id/shift
router.patch('/:id/shift', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { id } = req.params;
    const { shiftGroup } = req.body;

    if (shiftGroup === undefined) { 
        return res.status(400).json({ error: 'shiftGroup property is required.' }); 
    }
    
    try {
        const result = await User.findByIdAndUpdate(id, { shiftGroup: shiftGroup || null });
        if (!result) { return res.status(404).json({ error: 'Employee not found.' }); }
        res.json({ message: 'Employee shift updated successfully.' });
    } catch (error) {
        console.error("Error updating employee shift:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/admin/employees/:id
router.delete('/:id', [authenticateToken, isAdminOrHr], async (req, res) => {
    const { id } = req.params;
    try {
        const result = await User.findByIdAndDelete(id);
        if (!result) { return res.status(404).json({ error: 'Employee not found.' }); }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee.' });
    }
});

module.exports = router;