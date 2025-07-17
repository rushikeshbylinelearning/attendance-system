// frontend/src/components/ShiftInfoDisplay.jsx
import React from 'react';
import { Typography, Box, Paper, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import UpdateIcon from '@mui/icons-material/Update';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

// A robust helper function to format 'HH:mm:ss' strings to 'hh:mm AM/PM'
const formatTimeTo12Hour = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 'N/A';
    const [hours, minutes] = timeString.split(':');
    return new Date(1970, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const ShiftInfoDisplay = ({ shift, calculatedLogoutTime, clockInTime }) => {
    if (!shift) return null;

    const standardStartTime = formatTimeTo12Hour(shift.startTime);
    const standardEndTime = formatTimeTo12Hour(shift.endTime);
    
    const dynamicEndTime = calculatedLogoutTime ? new Date(calculatedLogoutTime).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
    }) : null;
    
    const isExtended = dynamicEndTime && dynamicEndTime !== standardEndTime;

    // Format clock-in time for display
    const formattedClockIn = clockInTime ? new Date(clockInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

    return (
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Shift</Typography>
                    <Typography variant="h6" component="p" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" />
                        {shift.shift_type === 'Flexible' ? 
                            <strong>{shift.name} ({shift.duration} Hrs)</strong> :
                            <strong>{shift.name} ({standardStartTime} - {standardEndTime})</strong>
                        }
                    </Typography>
                    {/* Display Clock In Time */}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Clock In Time</Typography>
                    <Typography variant="h6" component="p" sx={{ color: 'success.main', fontWeight: 'bold' }}>{formattedClockIn}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Required Log Out</Typography>
                    {isExtended ? (
                        <>
                            {(shift.shift_type === 'Fixed' && standardEndTime !== 'N/A') &&
                                <Typography variant="h6" component="p" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
                                    {standardEndTime}
                                </Typography>
                            }
                            <Typography variant="h5" component="p" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main', fontWeight: 'bold' }}>
                                <WarningAmberIcon />
                                {dynamicEndTime}
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="h5" component="p" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
                            <UpdateIcon />
                            {dynamicEndTime || standardEndTime}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};
export default ShiftInfoDisplay;