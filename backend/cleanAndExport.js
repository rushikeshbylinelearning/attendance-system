const fs = require('fs');
const csv = require('csvtojson');

// Path to your CSV file
const inputFilePath = './allocations.csv';
const outputFilePath = './assets_cleaned.json';

csv()
  .fromFile(inputFilePath)
  .then((jsonObj) => {
    const cleaned = [];

    jsonObj.forEach((row, index) => {
      // Trim keys and values
      const cleanedRow = {};
      for (const key in row) {
        const trimmedKey = key.trim();
        const trimmedValue = row[key]?.trim?.() || '';
        cleanedRow[trimmedKey] = trimmedValue;
      }

      // Use 'CPU Serial No' as the unique serialNumber (or fallback)
      const serial = cleanedRow['CPU Serial No'] || `unknown_${index + 1}`;

      // Skip rows without a usable serial number
      if (!serial || serial.toLowerCase() === 'n/a') return;

      cleanedRow.serialNumber = serial;

      cleaned.push(cleanedRow);
    });

    // Write to JSON
    fs.writeFileSync(outputFilePath, JSON.stringify(cleaned, null, 2));
    console.log(`✅ Cleaned JSON saved to: ${outputFilePath}`);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
  });
