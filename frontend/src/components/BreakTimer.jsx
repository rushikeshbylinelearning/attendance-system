// frontend/src/components/BreakTimer.jsx
import React, { useState, useEffect, memo } from 'react';
import { Typography, Divider } from '@mui/material';

const formatCountdown = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const BreakTimer = ({ breaks, paidBreakAllowance = 30, unpaidBreakAllowance = 10 }) => {
    const [countdown, setCountdown] = useState(0);
    const [overtime, setOvertime] = useState(0);
    
    const activeBreak = breaks.find(b => !b.endTime); 

    useEffect(() => {
        if (!activeBreak) return;

        const calculateTime = () => {
            const breakStartTime = new Date(activeBreak.startTime);
            const now = new Date();
            const elapsedSeconds = Math.floor((now - breakStartTime) / 1000);

            if (activeBreak.isPenalty) {
                setCountdown(0);
                setOvertime(elapsedSeconds);
                return;
            }

            let allowanceThisSessionSeconds = 0;
            if (activeBreak.breakType === 'Paid') {
                const paidMinutesAlreadyTaken = breaks
                    .filter(b => b._id !== activeBreak._id && b.breakType === 'Paid' && b.durationMinutes)
                    .reduce((sum, b) => sum + b.durationMinutes, 0);
                const remainingAllowance = paidBreakAllowance - paidMinutesAlreadyTaken;
                allowanceThisSessionSeconds = Math.max(0, remainingAllowance * 60);
            } else if (activeBreak.breakType === 'Unpaid') {
                // NEW: Unpaid breaks now get a 10-minute timer.
                // This is a "soft" limit for display; the backend handles the shift extension.
                allowanceThisSessionSeconds = unpaidBreakAllowance * 60;
            }

            const finalRemainingSeconds = allowanceThisSessionSeconds - elapsedSeconds;

            if (finalRemainingSeconds >= 0) {
                setCountdown(finalRemainingSeconds);
                setOvertime(0);
            } else {
                setCountdown(0);
                setOvertime(Math.abs(finalRemainingSeconds));
            }
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [activeBreak, breaks, paidBreakAllowance, unpaidBreakAllowance]);

    if (!activeBreak) return null;

    const isPaidBreak = activeBreak.breakType === 'Paid';
    const isPenaltyBreak = activeBreak.isPenalty;

    const getTitle = () => {
        if (isPenaltyBreak) return 'Penalty Break In Progress';
        return `${isPaidBreak ? 'Paid Break' : 'Unpaid Break'} In Progress`;
    };

    const getCaption = () => {
        if (isPenaltyBreak) {
            return "You have exceeded the maximum number of breaks. This time will be added to your shift.";
        }
        if (overtime > 0) {
            return isPaidBreak 
                ? "This extra time may be added to your shift."
                : "Unpaid break time extends your shift.";
        }
        return null;
    };

    return (
        <div className="card" style={{ textAlign: 'center', width: '100%', marginBottom: 16 }}>
            <Typography variant="h6" gutterBottom>
                {getTitle()}
            </Typography>
            <Divider style={{ margin: '8px 0' }} />
            
            {isPenaltyBreak || overtime > 0 ? (
                 <>
                    <Typography variant="body1">{isPenaltyBreak ? 'Penalty Time:' : 'Extra time taken:'}</Typography>
                    <Typography variant="h4" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                        +{formatCountdown(overtime)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                       {getCaption()}
                    </Typography>
                </>
            ) : (
                <>
                    <Typography variant="body1">Time Remaining:</Typography>
                    <Typography variant="h4" style={{ color: '#22c55e', fontWeight: 'bold' }}>
                        {formatCountdown(countdown)}
                    </Typography>
                </>
            )}
        </div>
    );
};

export default memo(BreakTimer);