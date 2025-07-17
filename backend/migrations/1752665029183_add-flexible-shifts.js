// backend/migrations/your-timestamp_add-flexible-shifts.js
exports.up = pgm => {
    // Add a type column
    pgm.addColumns('shift_master', {
        shift_type: { type: 'varchar(20)', notNull: true, default: 'Fixed' }
    });
    // Make start_time and end_time nullable
    pgm.alterColumn('shift_master', 'start_time', { notNull: false });
    pgm.alterColumn('shift_master', 'end_time', { notNull: false });
};

exports.down = pgm => {
    // Revert the changes
    pgm.alterColumn('shift_master', 'start_time', { notNull: true });
    pgm.alterColumn('shift_master', 'end_time', { notNull: true });
    pgm.dropColumns('shift_master', ['shift_type']);
};