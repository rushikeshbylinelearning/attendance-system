// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const breakRoutes = require('./routes/breaks');
const adminRoutes = require('./routes/admin');
const shiftRoutes = require('./routes/shifts');
const app = express();


// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing of JSON bodies
app.use(express.urlencoded({ extended: true })); // Enable parsing of URL-encoded bodies
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes)
app.use('/api/breaks', breakRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shifts', shiftRoutes);


// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Attendance Management System API!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});