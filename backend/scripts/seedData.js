const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Ticket = require('../models/Ticket');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/it-ticketing', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@company.com',
        password: 'admin123',
        employeeId: 'ADM001',
        seatNumber: 'A-001',
        department: 'IT',
        role: 'admin'
      },
      {
        name: 'John Doe',
        email: 'john.doe@company.com',
        password: 'user123',
        employeeId: 'EMP001',
        seatNumber: 'B-101',
        department: 'Engineering',
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        password: 'user123',
        employeeId: 'EMP002',
        seatNumber: 'B-102',
        department: 'Marketing',
        role: 'user'
      },
      {
        name: 'Tech Support',
        email: 'tech@company.com',
        password: 'tech123',
        employeeId: 'TECH001',
        seatNumber: 'A-002',
        department: 'IT',
        role: 'technician'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        password: 'user123',
        employeeId: 'EMP003',
        seatNumber: 'C-201',
        department: 'Sales',
        role: 'user'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Create sample tickets
    const tickets = [
      {
        createdBy: createdUsers[1]._id, // John Doe
        component: 'Monitor',
        issue: 'Screen flickering',
        description: 'My monitor has been flickering for the past hour. It\'s affecting my work productivity.',
        priority: 'High',
        status: 'Open'
      },
      {
        createdBy: createdUsers[2]._id, // Jane Smith
        component: 'KB',
        issue: 'Keys not responding',
        description: 'Several keys on my keyboard are not working, including space bar and enter key.',
        priority: 'Medium',
        status: 'In Progress',
        assignedTo: createdUsers[3]._id // Tech Support
      },
      {
        createdBy: createdUsers[1]._id, // John Doe
        component: 'CPU',
        issue: 'Random shutdowns',
        description: 'Computer shuts down randomly throughout the day. Usually happens when running multiple applications.',
        priority: 'Critical',
        status: 'Resolved',
        assignedTo: createdUsers[3]._id, // Tech Support
        resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        createdBy: createdUsers[4]._id, // Sarah Wilson
        component: 'Mouse',
        issue: 'Cursor not moving',
        description: 'Mouse cursor is not responding to movement. Tried different USB ports but issue persists.',
        priority: 'High',
        status: 'Open'
      },
      {
        createdBy: createdUsers[2]._id, // Jane Smith
        component: 'Headphone',
        issue: 'No sound',
        description: 'Headphones are not producing any sound. Checked volume settings and they seem fine.',
        priority: 'Low',
        status: 'Resolved',
        resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      }
    ];

    const createdTickets = await Ticket.insertMany(tickets);
    console.log('Created tickets:', createdTickets.length);

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@company.com / admin123');
    console.log('User: john.doe@company.com / user123');
    console.log('User: jane.smith@company.com / user123');
    console.log('Technician: tech@company.com / tech123');
    console.log('User: sarah.wilson@company.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();