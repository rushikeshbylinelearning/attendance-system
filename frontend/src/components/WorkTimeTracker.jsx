// frontend/src/components/WorkTimeTracker.jsx
import React, { useState, useEffect, memo } from 'react';
import { Typography } from '@mui/material';

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
            let activeSession = null;

            if (sessions) {
                sessions.forEach(session => {
                    if (session.endTime) {
                        completedTime += new Date(session.endTime) - new Date(session.startTime);
                    } else {
                        // This is the current, unterminated work session
                        activeSession = session;
                        activeSessionStart = new Date(session.startTime);
                    }
                });
            }

            let currentTotal = completedTime;
            
            // --- START OF FIX ---
            // If there's an active session, we need to calculate its duration up to "now",
            // regardless of whether we are 'Clocked In' or 'On Break'.
            // The status only determines if the timer KEEPS running.
            if (activeSessionStart) {
                currentTotal += new Date() - activeSessionStart;
            }
            // --- END OF FIX ---
            
            setTotalWorkTime(currentTotal);
        };

        calculateWorkTime();
        
        // The interval should ONLY run if the status is 'Clocked In'.
        // This is correct and doesn't need to change.
        if (status === 'Clocked In') {
            const interval = setInterval(calculateWorkTime, 1000);
            return () => clearInterval(interval);
        }
    }, [sessions, status]);

    return (
        <div className="card" style={{ marginTop: 8, padding: 16, textAlign: 'center' }}>
            <Typography variant="h5" component="p" style={{ fontWeight: 'bold', color: '#2563eb', marginTop: 8 }}>
                Total Work Time Today: {formatTime(totalWorkTime)}
            </Typography>
        </div>
    );
};

export default memo(WorkTimeTracker);