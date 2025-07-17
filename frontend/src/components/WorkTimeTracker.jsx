// frontend/src/components/WorkTimeTracker.jsx

import React, { useState, useEffect, memo } from 'react';
import { Typography } from '@mui/material';

// Helper function to format milliseconds into HH:MM:SS
const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const WorkTimeTracker = ({ sessions, status }) => {
    const [totalWorkTime, setTotalWorkTime] = useState(0);

    useEffect(() => {
        const calculateWorkTime = () => {
            let completedTime = 0;
            let activeSessionStart = null;

            if (sessions) {
                sessions.forEach(session => {
                    if (session.end_time) {
                        completedTime += new Date(session.end_time) - new Date(session.start_time);
                    } else {
                        activeSessionStart = new Date(session.start_time);
                    }
                });
            }

            let currentTotal = completedTime;
            // Only add the ticking time of the active session if the user is 'Clocked In'
            if (activeSessionStart && status === 'Clocked In') {
                currentTotal += new Date() - activeSessionStart;
            }
            
            setTotalWorkTime(currentTotal);
        };

        // Run the calculation immediately
        calculateWorkTime();
        
        // Only set up the ticking interval if the user is currently clocked in.
        // This is more efficient and prevents unnecessary timers.
        if (status === 'Clocked In') {
            const interval = setInterval(calculateWorkTime, 1000);
            // Cleanup function for the interval
            return () => clearInterval(interval);
        }

    // ** THIS IS THE FIX **
    // The effect will now re-run whenever the sessions array OR the status string changes.
    // This ensures that when the status changes to 'On Break', the timer correctly pauses.
    }, [sessions, status]);

    return (
        <Typography variant="h5" component="p" sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
            Total Work Time Today: {formatTime(totalWorkTime)}
        </Typography>
    );
};

// Memoize to prevent re-renders if props haven't changed
export default memo(WorkTimeTracker);