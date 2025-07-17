// backend/migrations/your-timestamp_add-attendance-tables.js
exports.shorthands = undefined;

exports.up = pgm => {
    // Define ENUM types for status
    pgm.createType('attendance_status_type', ['Present', 'Late', 'Absent', 'On Leave', 'Holiday', 'Half Day']);
    pgm.createType('break_type', ['Paid', 'Unpaid']);

    // Create ATTENDANCE_LOG table
    pgm.createTable('attendance_log', {
        id: 'id',
        employee_id: { type: 'integer', notNull: true, references: '"employee_master"(id)', onDelete: 'CASCADE' },
        attendance_date: { type: 'date', notNull: true },
        clock_in: { type: 'timestamptz' },
        clock_out: { type: 'timestamptz' },
        status: { type: 'attendance_status_type' },
        total_working_hours: { type: 'decimal(4, 2)' },
        overtime_minutes: { type: 'integer' },
        remarks: { type: 'text' },
    });
    // A user can only have one log per day.
    pgm.addConstraint('attendance_log', 'unique_employee_date', {
        unique: ['employee_id', 'attendance_date']
    });

    // Create BREAK_LOG table
    pgm.createTable('break_log', {
        id: 'id',
        attendance_log_id: { type: 'integer', notNull: true, references: '"attendance_log"(id)', onDelete: 'CASCADE' },
        start_time: { type: 'timestamptz', notNull: true },
        end_time: { type: 'timestamptz' },
        duration_minutes: { type: 'integer' },
        break_type: { type: 'break_type', notNull: true },
    });
};

exports.down = pgm => {
    pgm.dropTable('break_log');
    pgm.dropTable('attendance_log');
    pgm.dropType('break_type');
    pgm.dropType('attendance_status_type');
};