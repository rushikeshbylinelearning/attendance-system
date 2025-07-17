// frontend/src/components/BreakTimer.jsx

import React, { useState, useEffect, memo } from 'react';
import { Typography, Box, Divider } from '@mui/material';

const formatCountdown = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const BreakTimer = ({ breaks, paidBreakAllowance = 30 }) => {
    const [countdown, setCountdown] = useState(0);
    const [overtime, setOvertime] = useState(0);

    // Find the current active break. The effect depends on this specific object.
    const activeBreak = breaks.find(b => b.end_time === null);

    useEffect(() => {
        // If there's no active break, do nothing.
        if (!activeBreak) return;

        const calculateTime = () => {
            let allowanceThisSessionSeconds;

            if (activeBreak.break_type === 'Paid') {
                // Calculate time used from *other completed* paid breaks today.
                const paidMinutesAlreadyTaken = breaks
                    .filter(b => b.id !== activeBreak.id && b.break_type === 'Paid' && b.duration_minutes)
                    .reduce((sum, b) => sum + b.duration_minutes, 0);
                
                const remainingAllowance = paidBreakAllowance - paidMinutesAlreadyTaken;
                allowanceThisSessionSeconds = remainingAllowance * 60;

            } else {
                // For an unpaid break, the allowance is always a fresh 10 minutes.
                allowanceThisSessionSeconds = 10 * 60;
            }

            const breakStartTime = new Date(activeBreak.start_time);
            const now = new Date();
            const elapsedSeconds = Math.floor((now - breakStartTime) / 1000);
            
            const finalRemainingSeconds = allowanceThisSessionSeconds - elapsedSeconds;

            // Update the state based on the calculation
            if (finalRemainingSeconds >= 0) {
                setCountdown(finalRemainingSeconds);
                setOvertime(0);
            } else {
                setCountdown(0);
                setOvertime(Math.abs(finalRemainingSeconds));
            }
        };

        calculateTime(); // Run once immediately to prevent stale display
        const interval = setInterval(calculateTime, 1000);

        return () => clearInterval(interval); // Cleanup interval when component unmounts or effect re-runs

    // ** THIS IS THE FIX **
    // The effect will re-run if the entire 'breaks' array changes,
    // or crucially, if the specific 'activeBreak' object instance changes.
    // When you end a break and start a new one, the `activeBreak` object is different,
    // triggering a fresh calculation.
    }, [activeBreak, breaks, paidBreakAllowance]);

    if (!activeBreak) {
        return null; // Don't render if there's no active break
    }

    const isPaidBreak = activeBreak.break_type === 'Paid';

    return (
        <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h6" gutterBottom>
                {isPaidBreak ? 'Paid Break' : 'Unpaid Break'} In Progress
            </Typography>
            <Divider sx={{ my: 1 }} />
            {overtime === 0 ? (
                <>
                    <Typography variant="body1">Time Remaining:</Typography>
                    <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {formatCountdown(countdown)}
                    </Typography>
                </>
            ) : (
                <>
                    <Typography variant="body1">Extra time taken:</Typography>
                    <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        +{formatCountdown(overtime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        This may be added to your shift time.
                    </Typography>
                </>
            )}
        </Box>
    );
};

export default memo(BreakTimer);