require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');

// Corrected mapping based on your CSV headers
const CSV_COLUMN_MAPPING = {
    'Device': 'componentType',
    'Make': 'brand',
    'Type': 'model',
    'Serial No': 'serialNumber',
    'Invoice': 'invoiceLink',
    'Warranty Expiry': 'warrantyExpiry',
    'Warranty Registered ': 'isWarrantyRegistered'
};

const results = [];

// ... require statements and mapping ...

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB connected...');
        
        // Clear the collection first
        await InventoryItem.deleteMany({});
        console.log('✅ Cleared existing inventory.');

        const failedItems = [];
        let successCount = 0;
        
        const stream = fs.createReadStream('inventory_data.csv').pipe(csv());

        // Process each row one by one
        for await (const row of stream) {
            const formattedItem = {}; // Format the item as before
            // ... (copy the formatting loop from the previous version) ...
            for (const [csvCol, dbField] of Object.entries(CSV_COLUMN_MAPPING)) {
                let value = row[csvCol];
                if (value !== undefined && value.trim() !== '') {
                    if (dbField === 'warrantyExpiry') {
                        const date = new Date(value);
                        formattedItem[dbField] = isNaN(date.getTime()) || value === '0.00' ? null : date;
                    } else if (dbField === 'isWarrantyRegistered') {
                        formattedItem[dbField] = ['yes', 'true', '1'].includes(value.toLowerCase());
                    } else {
                        formattedItem[dbField] = value;
                    }
                }
            }

            try {
                // Try to save this single item
                const item = new InventoryItem(formattedItem);
                await item.save();
                successCount++;
            } catch (error) {
                // If it fails, log the error and the data that failed
                failedItems.push({ data: row, reason: error.message });
            }
        }

        console.log('\n================= IMPORT COMPLETE =================');
        console.log(`✅ Successfully inserted ${successCount} items.`);
        
        if (failedItems.length > 0) {
            console.error(`❌ Failed to insert ${failedItems.length} items.`);
            console.log('\n--- FAILED ITEMS (First 5) ---');
            console.log(JSON.stringify(failedItems.slice(0, 5), null, 2));
        }
        console.log('====================================================\n');

        mongoose.connection.close();
    });
    