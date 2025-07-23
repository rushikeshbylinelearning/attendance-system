// frontend/src/components/ShiftInfoDisplay.jsx
import React from 'react';
import { Typography, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TimerOffIcon from '@mui/icons-material/TimerOff';
import '../styles/ShiftInfoDisplay.css'; // Import the updated CSS file

// Helper to format time strings (e.g., "17:00") or Date objects to 12-hour format
const formatTimeTo12Hour = (time) => {
    if (!time) return 'N/A';

    let date;

    if (typeof time === 'string') {
        const parsedDate = new Date(time);
        if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
        } else {
            date = new Date(`1970-01-01T${time}`);
        }
    } else {
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
            <div className="card shift-info-card no-shift">
                <Typography>No shift assigned for today.</Typography>
            </div>
        );
    }

    // --- Data Normalization & Preparation ---
    const shiftName = shift.name || shift.shiftName;
    const shiftStartTime = shift.startTime;
    const shiftEndTime = shift.endTime;
    const shiftDuration = shift.duration || shift.durationHours;
    const isFlexible = !shiftStartTime;

    // --- Time Formatting ---
    const standardStartTime = formatTimeTo12Hour(shiftStartTime);
    const standardEndTime = formatTimeTo12Hour(shiftEndTime);
    const dynamicEndTime = formatTimeTo12Hour(calculatedLogoutTime);
    const formattedClockIn = formatTimeTo12Hour(clockInTime);
    
    // --- Display Logic ---
    const finalLogoutTime = dynamicEndTime !== 'N/A' ? dynamicEndTime : standardEndTime;
    const isLogoutTimeModified = dynamicEndTime !== 'N/A' && dynamicEndTime !== standardEndTime && !!clockInTime;

    const renderLogoutInfo = () => {
        if (!clockInTime) {
            return (
                <Typography variant="body1" className="info-value-group logout-time-calculate">
                    <TimerOffIcon fontSize="small" />
                    <span>Calculate</span>
                </Typography>
            );
        }

        if (isLogoutTimeModified) {
            return (
                <div className="info-value-group">
                    {!isFlexible && (
                        <Typography variant="caption" className="logout-time-standard">
                            Standard: {standardEndTime}
                        </Typography>
                    )}
                    <Typography variant="h6" component="p" className="logout-time-display logout-time-warning">
                        <WarningAmberIcon /> {finalLogoutTime}
                    </Typography>
                </div>
            );
        }
        
        return (
             <Typography variant="h6" component="p" className="logout-time-display logout-time-normal">
                <UpdateIcon /> {finalLogoutTime}
            </Typography>
        );
    };

    return (
        <div className="card shift-info-card">
            {/* Row 1: Shift Details */}
            <div className="info-row">
                <Typography className="info-label">Your Shift</Typography>
                <Typography className="info-value shift-name-value" component="div">
                    <AccessTimeIcon />
                    <strong>
                        {isFlexible 
                            ? `${shiftName} (${shiftDuration} Hours)`
                            : `${shiftName} (${standardStartTime} - ${standardEndTime})`
                        }
                    </strong>
                </Typography>
            </div>

            <Divider className="info-divider" />

            {/* Row 2: Clock In Time */}
            <div className="info-row">
                <Typography className="info-label">Clocked In At</Typography>
                <Typography variant="h6" className={`info-value clock-in-time ${formattedClockIn !== 'N/A' ? 'active' : ''}`}>
                    {formattedClockIn}
                </Typography>
            </div>

            <Divider className="info-divider" />

            {/* Row 3: Required Log Out */}
            <div className="info-row">
                <Typography className="info-label">Required Log Out</Typography>
                {renderLogoutInfo()}
            </div>
        </div>
    );
};

export default ShiftInfoDisplay;