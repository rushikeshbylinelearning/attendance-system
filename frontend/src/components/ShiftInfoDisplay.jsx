// frontend/src/components/ShiftInfoDisplay.jsx
import React from 'react';
import { Typography, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerOffIcon from '@mui/icons-material/TimerOff';

// Helper to format time strings (e.g., "17:00") or Date objects to 12-hour format
const formatTimeTo12Hour = (time) => {
    if (!time) return 'N/A';

    let date;

    // The 'time' can be:
    // 1. A full ISO date string (from clockInTime, calculatedLogoutTime)
    // 2. A "HH:mm" time string (from shift.startTime, shift.endTime)
    // 3. A Date object
    if (typeof time === 'string') {
        // First, try to parse as a full date string (like ISO format)
        const parsedDate = new Date(time);
        if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
        } else {
            // If that fails, assume it's a time-only string "HH:mm"
            date = new Date(`1970-01-01T${time}`);
        }
    } else {
        // Assume it's already a Date object or something `new Date` can handle
        date = new Date(time);
    }
    
    if (isNaN(date.getTime())) return 'N/A';

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const ShiftInfoDisplay = ({ shift, calculatedLogoutTime, clockInTime }) => {
    if (!shift) {
        return (
            <div className="card" style={{ background: '#fafafa', padding: 24, textAlign: 'center' }}>
                <Typography>No shift assigned for today.</Typography>
            </div>
        );
    }

    // --- Data Normalization & Preparation ---
    const shiftName = shift.name || shift.shiftName;
    const shiftStartTime = shift.startTime;
    const shiftEndTime = shift.endTime;
    const shiftDuration = shift.duration || shift.durationHours;
    
    // A flexible shift is defined by not having a fixed start time.
    const isFlexible = !shiftStartTime;

    // --- Time Formatting ---
    const standardStartTime = formatTimeTo12Hour(shiftStartTime);
    const standardEndTime = formatTimeTo12Hour(shiftEndTime);
    const dynamicEndTime = formatTimeTo12Hour(calculatedLogoutTime);
    const formattedClockIn = formatTimeTo12Hour(clockInTime);
    
    // --- Display Logic ---
    const finalLogoutTime = dynamicEndTime !== 'N/A' ? dynamicEndTime : standardEndTime;
    const isExtended = dynamicEndTime !== 'N/A' && dynamicEndTime !== standardEndTime && !!clockInTime;

    const renderLogoutInfo = () => {
        // Case 1: Flexible shift, not yet clocked in.
        if (isFlexible && !clockInTime) {
            return (
                <Typography variant="h6" component="p" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                    <TimerOffIcon /> Clock in to calculate
                </Typography>
            );
        }

        // Case 2: Logout time has been extended due to breaks or late clock-in.
        if (isExtended) {
            return (
                <>
                    {!isFlexible && (
                        <Typography variant="body1" component="p" style={{ textDecoration: 'line-through', color: '#9e9e9e' }}>
                            Standard: {standardEndTime}
                        </Typography>
                    )}
                    <Typography variant="h5" component="p" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 'bold' }}>
                        <WarningAmberIcon /> {finalLogoutTime}
                    </Typography>
                </>
            );
        }
        
        // Case 3: Standard or calculated logout time without extension.
        return (
            <Typography variant="h5" component="p" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontWeight: 'bold' }}>
                <UpdateIcon /> {finalLogoutTime}
            </Typography>
        );
    };

    return (
        <div className="card" style={{ background: '#fafafa', padding: 24, borderRadius: 8 }}>
            <div
                className="shift-card-container"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 16,
                }}
            >
                {/* Shift Block */}
                <div style={{ flex: 1, minWidth: 220, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">Your Shift</Typography>
                    <Typography variant="h6" component="p" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <AccessTimeIcon fontSize="small" />
                        <strong>
                            {isFlexible 
                                ? `${shiftName} (${shiftDuration} Hours)`
                                : `${shiftName} (${standardStartTime} - ${standardEndTime})`
                            }
                        </strong>
                    </Typography>
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: 12 }}>Clocked In At</Typography>
                    <Typography variant="h6" component="p" style={{ color: formattedClockIn !== 'N/A' ? '#22c55e' : '#6b7280', fontWeight: 'bold' }}>
                        {formattedClockIn}
                    </Typography>
                </div>

                {/* Divider */}
                <Divider orientation="vertical" flexItem style={{ margin: '0 16px', alignSelf: 'stretch' }} />

                {/* Logout Block */}
                <div style={{ flex: 1, minWidth: 220, textAlign: 'center' }}>
                    <Typography variant="body2" color="textSecondary">Required Log Out</Typography>
                    {renderLogoutInfo()}
                </div>
            </div>
        </div>
    );
};

export default ShiftInfoDisplay;