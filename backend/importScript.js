require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');

async function importData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected...');

        await InventoryItem.deleteMany({});
        console.log('✅ Cleared existing inventory collection.');

        const stream = fs.createReadStream('inventory_data.csv').pipe(csv());
        const seenSerialNumbers = new Set();
        const failedItems = [];
        let successCount = 0;

        for await (let row of stream) {
            
            // *** FIX #2: Skip empty rows from the CSV file ***
            if (!row['Device'] || !row['Make']) {
                console.log('... Skipping empty or invalid row.');
                continue; // Go to the next row
            }

            // --- FIX FOR MISALIGNED CPU DATA ---
            if (row['Device'] && row['Device'].trim().toLowerCase() === 'cpu cabinet') {
                console.log(`... Re-mapping data for CPU Cabinet (Sr. NO: ${row['Sr. NO']})`);
                row['Processor'] = row['Invoice'];
                row['Graphic Card'] = row['Invoice Date'];
                row['RAM'] = row['Warranty (Yrs)'];
                row['Storage'] = row['Warranty Expiry'];
                row['Device'] = 'CPU';
                row['Invoice'] = '';
                row['Invoice Date'] = '';
                row['Warranty (Yrs)'] = '';
                row['Warranty Expiry'] = '';
            }
            // --- END OF CPU FIX ---

            let serialNumber = row['Serial No']?.trim();

            if (!serialNumber || seenSerialNumbers.has(serialNumber)) {
                const deviceType = row['Device']?.trim() || 'Item';
                const srNo = row['Sr. NO']?.trim();
                const timestamp = Date.now();
                serialNumber = `TEMP-${deviceType.replace(/\s+/g, '-')}-${srNo}-${timestamp}`;
            }

            seenSerialNumbers.add(serialNumber);

            const isCpu = row['Device'] && row['Device'].toLowerCase().trim() === 'cpu';

            const inventoryData = {
                componentType: row['Device']?.trim(),
                brand: row['Make']?.trim(),
                model: row['Type']?.trim(),
                serialNumber: serialNumber,
                invoiceLink: row['Invoice']?.trim(),
                isWarrantyRegistered: ['yes', 'true', '1'].includes(String(row['Warranty Registered ']).trim().toLowerCase()),
                specifications: {}
            };
            
            if (row['Invoice Date']) {
                const purchaseDate = new Date(row['Invoice Date']);
                if (!isNaN(purchaseDate.getTime())) {
                    inventoryData.purchaseDate = purchaseDate;
                    const warrantyYears = parseInt(row['Warranty (Yrs)'], 10);
                    if (!isNaN(warrantyYears) && warrantyYears > 0) {
                        const expiry = new Date(purchaseDate);
                        expiry.setFullYear(expiry.getFullYear() + warrantyYears);
                        inventoryData.warrantyExpiry = expiry;
                    }
                }
            }

            if (isCpu) {
                inventoryData.specifications = {
                    processor: row['Processor']?.trim(),
                    graphicCard: row['Graphic Card']?.trim(),
                    ram: row['RAM']?.trim(),
                    storage: row['Storage']?.trim()
                };
            }

            try {
                if (!inventoryData.componentType || !inventoryData.brand) {
                    throw new Error('Missing required fields: componentType or brand');
                }
                const item = new InventoryItem(inventoryData);
                await item.save();
                successCount++;
            } catch (error) {
                failedItems.push({ data: row, reason: error.message });
            }
        }

        console.log('\n================= IMPORT COMPLETE =================');
        console.log(`✅ Successfully inserted ${successCount} items.`);
        if (failedItems.length > 0) {
            console.error(`❌ Failed to insert ${failedItems.length} items.`);
            console.log('\n--- FAILED ITEMS (First 5) ---');
            console.dir(failedItems.slice(0, 5), { depth: null });
        }
        console.log('====================================================\n');

    } catch (error) {
        console.error('❌ A critical error occurred:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed.');
    }
}

importData();