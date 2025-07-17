// backend/migrations/your-timestamp_add-daily-total-columns.js
exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('attendance_log', {
        // Total calculated work duration in minutes for the day
        total_work_minutes: { type: 'integer', default: 0 },
        // Total calculated break duration in minutes for the day
        total_break_minutes: { type: 'integer', default: 0 },
        // Amount of break time that exceeded the paid allowance
        penalty_minutes: { type: 'integer', default: 0 }
    });
};

exports.down = pgm => {
    pgm.dropColumns('attendance_log', ['total_work_minutes', 'total_break_minutes', 'penalty_minutes']);
};