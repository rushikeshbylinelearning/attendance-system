// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // <-- Add bcrypt import here
const connectDB = require('./db');

// Pre-load all Mongoose models
require('./models/User');
require('./models/Shift');
require('./models/AttendanceLog');
require('./models/AttendanceSession');
require('./models/BreakLog');
require('./models/LeaveRequest'); // <-- ADD THIS

// Route Imports
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const breakRoutes = require('./routes/breaks');
const adminRoutes = require('./routes/admin');
const employeeRoutes = require('./routes/employees');
const shiftRoutes = require('./routes/shifts');
const leaveRoutes = require('./routes/leaves'); // <-- ADD THIS

// --- Models --- (Need to import User model for the setup route)
const User = require('./models/User');

const app = express();

// Connect to MongoDB
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===================================================================
// START: ONE-TIME ADMIN SETUP ROUTE
// ===================================================================
// This is a temporary public route to create the first admin user.
// It should be REMOVED after the first admin is successfully created.
app.post('/api/setup/create-first-admin', async (req, res) => {
    try {
        // Check if any admin user already exists
        const adminCount = await User.countDocuments({ role: 'Admin' });

        if (adminCount > 0) {
            return res.status(403).json({ message: 'An admin user already exists. Setup is complete.' });
        }

        console.log('No admin found. Creating the first admin user...');

        const passwordHash = await bcrypt.hash('password123', 10);
        const firstAdmin = await User.create({
            employeeCode: 'ADMIN001',
            fullName: 'Main Admin',
            email: 'admin@system.com',
            passwordHash: passwordHash,
            role: 'Admin',
            joiningDate: new Date(),
            isActive: true
        });

        console.log('First admin user created successfully:', firstAdmin.email);
        res.status(201).json({ 
            message: 'First admin user created successfully! Please log in.',
            admin: {
                email: firstAdmin.email,
                password: 'password123'
            }
        });

    } catch (error) {
        console.error('Error during admin setup:', error);
        res.status(500).json({ error: 'Failed to create the first admin user.' });
    }
});
// ===================================================================
// END: ONE-TIME ADMIN SETUP ROUTE
// ===================================================================


// --- ROUTE MOUNTING ---
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/leaves', leaveRoutes); // <-- ADD THIS
app.use('/api/admin/employees', employeeRoutes);
app.use('/api/admin/shifts', shiftRoutes);
app.use('/api/admin', adminRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: '✅ Attendance Management System API is running!' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});