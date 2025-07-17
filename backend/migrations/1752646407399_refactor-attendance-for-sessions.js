// backend/migrations/your-timestamp_refactor-attendance...
exports.shorthands = undefined;

exports.up = pgm => {
    // 1. Remove old columns from attendance_log
    pgm.dropColumns('attendance_log', ['clock_in', 'clock_out', 'total_working_hours', 'overtime_minutes']);

    // 2. Create the new attendance_sessions table
    pgm.createTable('attendance_sessions', {
        id: 'id',
        attendance_log_id: {
            type: 'integer',
            notNull: true,
            references: '"attendance_log"(id)',
            onDelete: 'CASCADE',
        },
        start_time: { type: 'timestamptz', notNull: true },
        end_time: { type: 'timestamptz' }, // Null when session is active
    });
};

exports.down = pgm => {
    // To reverse, drop the new table and add the old columns back
    pgm.dropTable('attendance_sessions');
    pgm.addColumns('attendance_log', {
        clock_in: { type: 'timestamptz' },
        clock_out: { type: 'timestamptz' },
        total_working_hours: { type: 'decimal(4, 2)' },
        overtime_minutes: { type: 'integer' },
    });
};