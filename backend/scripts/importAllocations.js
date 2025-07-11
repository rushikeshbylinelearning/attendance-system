const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Allocation = require('../models/Allocation');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function importCSV() {
  const rows = [];

  // Step 1: Read CSV
  await new Promise((resolve, reject) => {
  fs.createReadStream('allocations-cleaned.csv')
    .pipe(csv({ mapHeaders: ({ header }) => header.trim() })) // ✅ FIX HERE
    .on('data', (data) => rows.push(data))
    .on('end', resolve)
    .on('error', reject);
});


  const allocations = [];

  for (const data of rows) {
    if (!data || Object.keys(data).length === 0) continue;

    const rawCode = data['Employee Code']?.trim();
    const employeeCode = rawCode?.replace(/^#/, '');

    if (!employeeCode) {
      console.warn('⛔ Missing Employee Code, skipping row:', data);
      continue;
    }

    // Step 2: Lookup or create user
  let user = await User.findOne({ employeecode: employeeCode });

if (!user) {
  try {
    console.log('Creating user for:', { employeeCode, name: data['Employee Name '] });

    user = await User.create({
  name: data['Employee Name']?.trim() || 'Unknown',
  email: `${employeeCode.toLowerCase()}@example.com`,
  password: 'default123',
  employeeId: employeeCode, // ✅ matches your schema
  seatNumber: data['Seat No']?.trim(),
  role: 'employee'
});

    console.log(`🆕 Created user for employee code ${employeeCode}`);
  } catch (err) {
    console.error(`❌ Failed to create user ${employeeCode}:`, err.message);
    continue;
  }
}


    // Step 3: Build allocation object
    allocations.push({
      user: user._id,
      employeeCode: rawCode,
      employeeName: data['Employee Name']?.trim(),
      role: data['Role']?.trim(),
      sequence: data['Sequence']?.trim(),
      seatNo: data['Seat No']?.trim(),
      monitor: {
        make: data['Monitor make']?.trim(),
        serialNo: data['Monitor Serial No']?.trim(),
      },
      keyboard: {
        make: data['Keyboard make']?.trim(),
        serialNo: data['KB Serial No']?.trim(),
      },
      mouse: {
        make: data['Mouse make']?.trim(),
        serialNo: data['Mouse Serial No']?.trim(),
      },
      ups: {
        make: data['UPS make']?.trim(),
        serialNo: data['UPS Serial No']?.trim(),
      },
      cpu: {
        box: data['CPU Box']?.trim(),
        serialNo: data['CPU Serial No']?.trim(),
        processor: data['Processor']?.trim(),
        gpu: data['GPU']?.trim(),
        ram: data['RAM']?.trim(),
        hdd: data['HDD']?.trim(),
      },
      penTab: {
        name: data['Pen Tab']?.trim(),
        serialNo: data['Serial No']?.trim(), // adjust if needed
      },
      headphone: {
        name: data['HeadPhone']?.trim(),
        serialNo: data['Serial No_1']?.trim(), // adjust if needed
      },
    });
  }

  
  // Step 4: Insert all allocations
  try {
    await Allocation.insertMany(allocations);
    console.log('✅ Allocations imported successfully and linked to users!');
  } catch (err) {
    console.error('❌ Failed to import allocations:', err.message);
  } finally {
    mongoose.connection.close();
  }
}



importCSV();
