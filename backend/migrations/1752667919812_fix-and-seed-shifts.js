// backend/migrations/your-timestamp_fix-and-seed-shifts.js
exports.up = pgm => {
    // First, delete all existing shifts to start clean.
    pgm.sql('DELETE FROM shift_master;');
    
    // Now, insert the correct new shifts
    pgm.sql(`
        INSERT INTO shift_master (shift_name, start_time, end_time, duration_hours, paid_break_minutes, shift_type) VALUES
        ('General Shift', '10:00:00', '19:00:00', 9.00, 30, 'Fixed'),
        ('Afternoon Shift', '11:00:00', '20:00:00', 9.00, 30, 'Fixed'),
        ('Evening Shift', '13:00:00', '22:00:00', 9.00, 30, 'Fixed'),
        ('Flexible 9-Hour', NULL, NULL, 9.00, 30, 'Flexible');
    `);
};

exports.down = pgm => {
    // Reverting this is simply clearing the table again.
    pgm.sql('DELETE FROM shift_master;');
};