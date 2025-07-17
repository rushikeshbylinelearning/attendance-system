// backend/migrations/your-timestamp_enhance-attendance-break-logic.js
exports.shorthands = undefined;

exports.up = pgm => {
    // Add new columns to ATTENDANCE_LOG
    pgm.addColumns('attendance_log', {
        shift_extension_minutes: { type: 'integer', default: 0 },
        auto_shift_extension_flag: { type: 'boolean', default: false },
        // 'remarks' column already exists, which is good.
    });

    // Add new columns to BREAK_LOG
    pgm.addColumns('break_log', {
        reason: { type: 'text' },
        // 'type' ENUM already exists as 'break_type'
    });
};

exports.down = pgm => {
    pgm.dropColumns('attendance_log', ['shift_extension_minutes', 'auto_shift_extension_flag']);
    pgm.dropColumns('break_log', ['reason']);
};