const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    requestType: {
        type: String,
        enum: ['Swap', 'Voluntary Work', 'Compensation'],
        required: true,
    },
    leaveDates: [{ type: Date, required: true }],
    alternateDate: { type: Date }, // Specifically for 'Swap' type
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);