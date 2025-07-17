// frontend/src/components/LiveClock.jsx
import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

const LiveClock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    return (
        <>
            <Typography variant="h6">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                {currentTime.toLocaleTimeString('en-US')}
            </Typography>
        </>
    );
};

export default LiveClock;