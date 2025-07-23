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
        <div className="card" style={{ padding: 16, textAlign: 'center', minWidth: 220 }}>
            <Typography variant="h6">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography variant="h3" style={{ fontWeight: 'bold' }}>
                {currentTime.toLocaleTimeString('en-US')}
            </Typography>
        </div>
    );
};
export default LiveClock;