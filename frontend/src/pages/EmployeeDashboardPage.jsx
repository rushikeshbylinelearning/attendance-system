// frontend/src/pages/EmployeeDashboardPage.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Typography, Button, CircularProgress, Alert, Stack, Menu, MenuItem } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WorkTimeTracker from '../components/WorkTimeTracker';
import BreakTimer from '../components/BreakTimer';
import ShiftInfoDisplay from '../components/ShiftInfoDisplay';
import WorkSchedule from '../components/WeeklyTimeCards';
import LiveClock from '../components/LiveClock';
import '../styles/Page.css';

const MemoizedWorkSchedule = memo(WorkSchedule);

/**
 * Calculates the adjusted logout time based on shift details, clock-in time, and total break duration.
 * This function handles late clock-ins, break overages, AND unused break time credits.
 */
const calculateAdjustedLogoutTime = ({ shift, clockInTime, totalBreakTakenInMinutes }) => {
    if (!shift || !clockInTime) {
        return null;
    }

    const clockInDate = new Date(clockInTime);
    let finalLogoutDate;

    // --- Logic for Fixed Shifts ---
    if (shift.startTime && shift.endTime) {
        const allowedPaidBreakMins = shift.paidBreak || 30;

        // This will be positive for overages and negative for underages (unused break time).
        const breakAdjustmentMins = totalBreakTakenInMinutes - allowedPaidBreakMins;

        const today = clockInDate.toISOString().split('T')[0];
        const standardStartTime = new Date(`${today}T${shift.startTime}`);
        const standardEndTime = new Date(`${today}T${shift.endTime}`);

        // Handle overnight shifts
        if (standardEndTime < standardStartTime) {
            standardEndTime.setDate(standardEndTime.getDate() + 1);
        }

        // Calculate penalty for clocking in late.
        const lateClockInMs = Math.max(0, clockInDate.getTime() - standardStartTime.getTime());
        
        // The base logout time is the standard end time, adjusted for any lateness.
        const baseLogoutDate = new Date(standardEndTime.getTime() + lateClockInMs);

        // Now, apply the break adjustment (penalty or credit) to the base logout time.
        baseLogoutDate.setMinutes(baseLogoutDate.getMinutes() + breakAdjustmentMins);
        finalLogoutDate = baseLogoutDate;

    } 
    // --- Logic for Flexible Shifts ---
    else if (shift.duration) { 
        // For flexible shifts, the formula is simpler:
        // Logout Time = Clock-In Time + Required Work Duration + Actual Breaks Taken
        
        const shiftWorkDurationMs = shift.duration * 60 * 60 * 1000;
        const actualBreaksMs = totalBreakTakenInMinutes * 60 * 1000;
        
        finalLogoutDate = new Date(clockInDate.getTime() + shiftWorkDurationMs + actualBreaksMs);
    } 
    else {
        // If shift has no start/end time and no duration, we can't calculate.
        return null;
    }

    return finalLogoutDate.toISOString();
};


const EmployeeDashboardPage = () => {
    const { user } = useAuth();
    const [dailyData, setDailyData] = useState(null);
    const [weeklyLogs, setWeeklyLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    
    // --- STATE to hold our correctly calculated logout time ---
    const [clientCalculatedLogoutTime, setClientCalculatedLogoutTime] = useState(null);
    
    const openBreakMenu = Boolean(anchorEl);

    const fetchAllData = useCallback(async () => {
        try {
            const [statusRes, logsRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/attendance/my-weekly-log')
            ]);
            setDailyData(statusRes.data);
            setWeeklyLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        } catch (err) {
            setError('Failed to load dashboard data. Please refresh the page.');
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // --- EFFECT to calculate logout time on the client-side whenever data changes ---
    useEffect(() => {
        if (dailyData && user?.shift) {
            const clockInTime = dailyData.sessions?.[0]?.startTime;
            
            // Sum up duration of ONLY completed breaks
            const totalBreakTakenInMinutes = dailyData.breaks?.reduce((total, br) => {
                return total + (br.durationMinutes || 0);
            }, 0) || 0;

            if (clockInTime) {
                const adjustedLogoutTime = calculateAdjustedLogoutTime({
                    shift: user.shift,
                    clockInTime: clockInTime,
                    totalBreakTakenInMinutes: totalBreakTakenInMinutes,
                });
                setClientCalculatedLogoutTime(adjustedLogoutTime);
            }
        }
    }, [dailyData, user?.shift]);

    const handleApiCall = async (apiCall) => {
        setActionLoading(true);
        setError('');
        try {
            await apiCall();
            await fetchAllData();
        } catch (err) {
            setError(err.response?.data?.error || 'An unexpected error occurred.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClockIn = () => handleApiCall(() => api.post('/attendance/clock-in'));
    const handleClockOut = () => handleApiCall(() => api.post('/attendance/clock-out'));
    const handleEndBreak = () => handleApiCall(() => api.post('/breaks/end'));
    const handleOpenBreakMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseBreakMenu = () => setAnchorEl(null);
    const handleStartBreak = (breakType) => {
        handleCloseBreakMenu();
        handleApiCall(() => api.post('/breaks/start', { breakType }));
    };

    const paidBreakAllowance = user?.shift?.paidBreak || 30;
    const paidMinutesUsed = dailyData?.breaks?.filter(b => b.breakType === 'Paid' && b.durationMinutes).reduce((sum, b) => sum + b.durationMinutes, 0) || 0;
    const hasExhaustedPaidBreak = paidMinutesUsed >= paidBreakAllowance;
    const hasTakenUnpaidBreak = dailyData?.breaks?.some(b => b.breakType === 'Unpaid');

    const renderActionArea = () => {
        if (actionLoading) return <CircularProgress />;
        switch (dailyData?.status) {
            case 'Not Clocked In':
                return <Button variant="contained" color="primary" size="large" onClick={handleClockIn}>Clock In</Button>;
            case 'Clocked In':
                return (
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                        <Button variant="contained" color="secondary" onClick={handleOpenBreakMenu}>Start Break</Button>
                        <Menu anchorEl={anchorEl} open={openBreakMenu} onClose={handleCloseBreakMenu}>
                            <MenuItem onClick={() => handleStartBreak('Paid')} disabled={hasExhaustedPaidBreak}>
                                Paid Break ({paidBreakAllowance - paidMinutesUsed} mins left)
                            </MenuItem>
                            <MenuItem onClick={() => handleStartBreak('Unpaid')} disabled={hasTakenUnpaidBreak}>Unpaid Break</MenuItem>
                        </Menu>
                        <Button variant="contained" color="error" onClick={handleClockOut}>Clock Out</Button>
                    </Stack>
                );
            case 'On Break':
                return (
                    <Stack spacing={2} alignItems="center" sx={{width: '100%'}}>
                        <BreakTimer breaks={dailyData.breaks} paidBreakAllowance={paidBreakAllowance} />
                        <Button variant="contained" color="warning" size="large" onClick={handleEndBreak}>End Break</Button>
                    </Stack>
                );
            case 'Clocked Out':
                return (
                    <Stack spacing={2} alignItems="center">
                        <Typography variant="h6" color="success.main">You are currently clocked out.</Typography>
                        <Button variant="contained" color="primary" onClick={handleClockIn}>Clock In Again</Button>
                    </Stack>
                );
            default:
                return <CircularProgress />;
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ height: '60vh' }}><CircularProgress size={60} /></div>;
    }

    return (
        <div className="dashboard-page wide-dashboard-page">
            <div className="dashboard-header align-center-between gap-16">
                <Typography variant="h4">Welcome, {user.name}!</Typography>
                <div className="live-clock-card-small"><LiveClock /></div>
            </div>

            {error && <Alert severity="error" sx={{ marginBottom: 16 }} onClose={() => setError('')}>{error}</Alert>}

            <div className="card" style={{ marginBottom: 24 }}>
                <MemoizedWorkSchedule logs={weeklyLogs} shift={user?.shift} />
            </div>

            <div className="dashboard-widgets polished-widgets">
                <div className="card polished-widget-card">
                    <ShiftInfoDisplay 
                        shift={user?.shift} 
                        // --- FIX: Pass our correctly calculated time instead of the one from the API ---
                        calculatedLogoutTime={clientCalculatedLogoutTime ? new Date(clientCalculatedLogoutTime) : null}
                        clockInTime={dailyData?.sessions?.[0]?.startTime}
                    />
                </div>
                <div className="card polished-widget-card flex-center">{renderActionArea()}</div>
                <div className="card polished-widget-card">
                    <Typography variant="h6" gutterBottom>Time Tracker</Typography>
                    <WorkTimeTracker sessions={dailyData?.sessions} status={dailyData?.status} />
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboardPage;