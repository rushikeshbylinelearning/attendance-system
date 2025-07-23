import React, { useState, useEffect, useCallback, memo } from 'react';
import { Typography, Button, CircularProgress, Alert, Stack, Menu, MenuItem, Box } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import WorkTimeTracker from '../components/WorkTimeTracker';
import BreakTimer from '../components/BreakTimer';
import ShiftInfoDisplay from '../components/ShiftInfoDisplay';
import WorkSchedule from '../components/WeeklyTimeCards';
import LiveClock from '../components/LiveClock';
import SaturdaySchedule from '../components/SaturdaySchedule'; // Component is ready
import '../styles/Page.css';

const MemoizedWorkSchedule = memo(WorkSchedule);

const calculateAdjustedLogoutTime = ({ shift, clockInTime, totalBreakTakenInMinutes }) => {
    if (!shift || !clockInTime) { return null; }
    const clockInDate = new Date(clockInTime);
    let finalLogoutDate;
    if (shift.startTime && shift.endTime) {
        const allowedPaidBreakMins = shift.paidBreak || 30;
        const breakAdjustmentMins = totalBreakTakenInMinutes - allowedPaidBreakMins;
        const today = clockInDate.toISOString().split('T')[0];
        const standardStartTime = new Date(`${today}T${shift.startTime}`);
        const standardEndTime = new Date(`${today}T${shift.endTime}`);
        if (standardEndTime < standardStartTime) { standardEndTime.setDate(standardEndTime.getDate() + 1); }
        const lateClockInMs = Math.max(0, clockInDate.getTime() - standardStartTime.getTime());
        const baseLogoutDate = new Date(standardEndTime.getTime() + lateClockInMs);
        baseLogoutDate.setMinutes(baseLogoutDate.getMinutes() + breakAdjustmentMins);
        finalLogoutDate = baseLogoutDate;
    } else if (shift.duration) { 
        const shiftWorkDurationMs = shift.duration * 60 * 60 * 1000;
        const actualBreaksMs = totalBreakTakenInMinutes * 60 * 1000;
        finalLogoutDate = new Date(clockInDate.getTime() + shiftWorkDurationMs + actualBreaksMs);
    } else { return null; }
    return finalLogoutDate.toISOString();
};


const EmployeeDashboardPage = () => {
    const { user } = useAuth();
    const [dailyData, setDailyData] = useState(null);
    const [weeklyLogs, setWeeklyLogs] = useState([]);
    const [myRequests, setMyRequests] = useState([]); // <-- NEW STATE to hold leave requests
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [clientCalculatedLogoutTime, setClientCalculatedLogoutTime] = useState(null);
    
    const openBreakMenu = Boolean(anchorEl);

    const fetchAllData = useCallback(async () => {
        try {
            // --- FIX: Add the API call to fetch leave requests ---
            const [statusRes, logsRes, requestsRes] = await Promise.all([
                api.get('/attendance/status'),
                api.get('/attendance/my-weekly-log'),
                api.get('/leaves/my-requests') // This call was missing
            ]);
            setDailyData(statusRes.data);
            setWeeklyLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
            setMyRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []); // <-- Set the state with the new data
        } catch (err) {
            setError('Failed to load dashboard data. Please refresh the page.');
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    useEffect(() => {
        if (dailyData && user?.shift) {
            const clockInTime = dailyData.sessions?.[0]?.startTime;
            const totalBreakTakenInMinutes = dailyData.breaks?.reduce((total, br) => total + (br.durationMinutes || 0), 0) || 0;
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
            case 'Not Clocked In': return <Button variant="contained" color="primary" size="large" onClick={handleClockIn}>Clock In</Button>;
            case 'Clocked In': return (
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                    <Button variant="contained" color="secondary" onClick={handleOpenBreakMenu}>Start Break</Button>
                    <Menu anchorEl={anchorEl} open={openBreakMenu} onClose={handleCloseBreakMenu}>
                        <MenuItem onClick={() => handleStartBreak('Paid')} disabled={hasExhaustedPaidBreak}>Paid Break ({paidBreakAllowance - paidMinutesUsed} mins left)</MenuItem>
                        <MenuItem onClick={() => handleStartBreak('Unpaid')} disabled={hasTakenUnpaidBreak}>Unpaid Break</MenuItem>
                    </Menu>
                    <Button variant="contained" color="error" onClick={handleClockOut}>Clock Out</Button>
                </Stack>
            );
            case 'On Break': return (
                <Stack spacing={2} alignItems="center" sx={{width: '100%'}}>
                    <BreakTimer breaks={dailyData.breaks} paidBreakAllowance={paidBreakAllowance} />
                    <Button variant="contained" color="warning" size="large" onClick={handleEndBreak}>End Break</Button>
                </Stack>
            );
            case 'Clocked Out': return (
                <Stack spacing={2} alignItems="center">
                    <Typography variant="h6" color="success.main">You are currently clocked out.</Typography>
                    <Button variant="contained" color="primary" onClick={handleClockIn}>Clock In Again</Button>
                </Stack>
            );
            default: return <CircularProgress />;
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 3, mt: 3, alignItems: 'start' }}>
                <Stack spacing={3}>
                    <div className="card" style={{ padding: 0 }}>
                        <MemoizedWorkSchedule logs={weeklyLogs} shift={user?.shift} />
                    </div>
                     <div className="dashboard-widgets polished-widgets">
                        <div className="card polished-widget-card">
                            <ShiftInfoDisplay 
                                shift={user?.shift} 
                                calculatedLogoutTime={clientCalculatedLogoutTime ? new Date(clientCalculatedLogoutTime) : null}
                                clockInTime={dailyData?.sessions?.[0]?.startTime}
                            />
                        </div>
                        <div className="card polished-widget-card flex-center">{renderActionArea()}</div>
                    </div>
                </Stack>
                <Stack spacing={3}>
                    <div className="card polished-widget-card">
                        <Typography variant="h6" gutterBottom>Time Tracker</Typography>
                        <WorkTimeTracker sessions={dailyData?.sessions} status={dailyData?.status} />
                    </div>
                    {/* --- FIX: Pass the fetched requests to the component --- */}
                    <SaturdaySchedule 
                        policy={user.alternateSaturdayPolicy} 
                        requests={myRequests} 
                    />
                </Stack>
            </Box>
        </div>
    );
};

export default EmployeeDashboardPage;