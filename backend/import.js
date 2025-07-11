// import.js

// ======= 1. SETUP =======
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

// Import your application's models so the script understands the data structure
const User = require('./models/User');
const Allocation = require('./models/Allocation');

// ======= 2. THE MAIN IMPORT LOGIC =======
const importData = async () => {
  try {
    // Connect to the database using the URI from your .env file
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully.');

    // Clear old data to ensure a perfect, fresh start.
    console.log('🗑️ Clearing old Users and Allocations...');
    await Allocation.deleteMany({});
    await User.deleteMany({});
    console.log('✨ Database is now clean.');

    const dataRows = [];
    const filePath = path.resolve(__dirname, 'allocations-cleaned.csv'); // Assumes the CSV is in the same folder

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => dataRows.push(row))
      .on('end', async () => {
        console.log(`🏁 CSV file processed. Found ${dataRows.length} rows to import.`);

        for (const row of dataRows) {
          // --- 1. Find or Create the User ---
          const employeeCode = row['Employee Code']?.replace('#', '').trim();
          const employeeName = row['Employee Name']?.trim(); // Note the trailing space in the header

          if (!employeeCode || employeeCode === '') {
            console.warn('⏩ Skipping row with missing Employee Code.');
            continue;
          }

          // This command will now work perfectly with your updated User schema
          const user = await User.findOneAndUpdate(
            { employeeId: employeeCode },
            { $setOnInsert: { name: employeeName, employeeId: employeeCode, role: row['Role']?.trim() || 'user' } },
            { upsert: true, new: true }
          );

          // --- 2. Prepare the "Flat" Allocation Document ---
          const allocationData = {
            user: user._id,
            employeeId: user.employeeId,
            employeeName: user.name,
            role: row['Role']?.trim(),
            seatNo: row['Seat No']?.trim(),
            monitorMake: row['Monitor make']?.trim(),
            monitorSerialNo: row['Monitor Serial No']?.trim(),
            keyboardMake: row['Keyboard make']?.trim(),
            kbSerialNo: row['KB Serial No']?.trim(),
            mouseMake: row['Mouse make']?.trim(),
            mouseSerialNo: row['Mouse Serial No']?.trim(),
            upsMake: row['UPS make']?.trim(),
            upsSerialNo: row['UPS Serial No']?.trim(),
            cpuBox: row['CPU Box']?.trim(),
            cpuSerialNo: row['CPU Serial No']?.trim(),
            processor: row['Processor']?.trim(),
            gpu: row['GPU']?.trim(),
            ram: row['RAM']?.trim(),
            hdd: row['HDD']?.trim(),
            penTabMake: row['Pen Tab']?.trim(),
            penTabSn: row['Serial No']?.trim(), // This CSV column is ambiguous, mapped to Pen Tab S/N
            headphoneMake: row['HeadPhone']?.trim(),
          };

          // --- 3. Create or Update the Allocation ---
          await Allocation.findOneAndUpdate(
              { employeeId: user.employeeId }, // Find the allocation by the unique employee ID
              allocationData,                  // The new flat data
              { upsert: true }                  // Create it if it doesn't exist
          );

          console.log(`👤 Processed allocation for: ${user.name} (${user.employeeId})`);
        }

        console.log('\n🎉 All data has been successfully imported! Users are created and ready for you to edit.');
        mongoose.connection.close();
      });
  } catch (error) {
    console.error('\n❌ A critical error occurred during the import:');
    console.error(error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// ======= 3. RUN THE SCRIPT =======
importData();