// frontend/src/pages/EmployeeDashboardPage.jsx

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
    Typography, 
    Box, 
    Button, 
    Paper, 
    Grid, 
    CircularProgress, 
    Alert, 
    Stack, 
    Menu, 
    MenuItem 
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Import all child components
import WorkTimeTracker from '../components/WorkTimeTracker';
import BreakTimer from '../components/BreakTimer';
import ShiftInfoDisplay from '../components/ShiftInfoDisplay';
import WorkSchedule from '../components/WeeklyTimeCards';
import LiveClock from '../components/LiveClock';

// Import the dedicated stylesheet for this page
import '../styles/EmployeeDashboardPage.css';

// Memoize the WorkSchedule component for performance
const MemoizedWorkSchedule = memo(WorkSchedule);

const EmployeeDashboardPage = () => {
    const { user } = useAuth();
    
    // State for all data fetched from APIs
    const [dailyData, setDailyData] = useState(null);
    const [weeklyLogs, setWeeklyLogs] = useState([]);
    
    // State for UI control
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const openBreakMenu = Boolean(anchorEl);

    // This single function fetches all necessary data for the dashboard
    const fetchAllData = useCallback(async () => {
        try {
            const [statusRes, logsRes] = await Promise.all([
                axios.get('/api/attendance/status'),
                axios.get('/api/attendance/my-weekly-log')
            ]);
            setDailyData(statusRes.data);
            setWeeklyLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
        } catch (err) {
            setError('Failed to load dashboard data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Generic handler for API actions
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

    // Specific action handlers
    const handleClockIn = () => handleApiCall(() => axios.post('/api/attendance/clock-in'));
    const handleClockOut = () => handleApiCall(() => axios.post('/api/attendance/clock-out'));
    const handleEndBreak = () => handleApiCall(() => axios.post('/api/breaks/end'));
    const handleOpenBreakMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseBreakMenu = () => setAnchorEl(null);
    const handleStartBreak = (breakType) => {
        handleCloseBreakMenu();
        handleApiCall(() => axios.post('/api/breaks/start', { breakType }));
    };

    // ** THIS IS THE UPDATED LOGIC FOR RESUMABLE PAID BREAKS **
    // 1. Calculate the total minutes of completed paid breaks
    const paidMinutesUsed = dailyData?.breaks
        ?.filter(b => b.break_type === 'Paid' && b.duration_minutes)
        .reduce((sum, b) => sum + b.duration_minutes, 0) || 0;
    
    // 2. Get the total allowance from the user's shift info
    const paidBreakAllowance = user?.shift?.paidBreak || 30;

    // 3. Determine if the allowance has been fully used
    const hasExhaustedPaidBreak = paidMinutesUsed >= paidBreakAllowance;

    // 4. The logic for the unpaid break remains the same (check if one has been taken)
    const hasTakenUnpaidBreak = dailyData?.breaks?.some(b => b.break_type === 'Unpaid');


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
                            <MenuItem 
                                onClick={() => handleStartBreak('Paid')} 
                                disabled={hasExhaustedPaidBreak}
                            >
                                Paid Break ({paidBreakAllowance - paidMinutesUsed} mins left)
                            </MenuItem>
                            <MenuItem 
                                onClick={() => handleStartBreak('Unpaid')} 
                                disabled={hasTakenUnpaidBreak}
                            >
                                10-Min Unpaid Break
                            </MenuItem>
                        </Menu>
                        <Button variant="contained" color="error" onClick={handleClockOut}>Clock Out</Button>
                    </Stack>
                );
            
            case 'On Break':
                return (
                    <Stack spacing={2} alignItems="center" sx={{width: '100%'}}>
                        <BreakTimer breaks={dailyData.breaks} />
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
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress size={60} /></Box>;
    }

    return (
        <Box className="employee-dashboard-container">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h4">Welcome, {user.name}!</Typography>
                <Paper variant="outlined" sx={{ p: '2px 16px', textAlign: 'right' }}>
                    <LiveClock />
                </Paper>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            
            <MemoizedWorkSchedule logs={weeklyLogs} shift={user?.shift} />

            <Paper sx={{ mt: 3, p: 3 }}>
                <Grid container spacing={3} alignItems="stretch">
                    <Grid item xs={12}>
                        <ShiftInfoDisplay 
                            shift={user?.shift} 
                            calculatedLogoutTime={dailyData?.calculatedLogoutTime}
                            clockInTime={dailyData?.sessions && dailyData.sessions.length > 0 ? dailyData.sessions[0].start_time : null}
                        />
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <Paper variant="outlined" sx={{ p: 3, display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            {renderActionArea()}
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper variant="outlined" sx={{ p: 3, height: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>Time Tracker</Typography>
                            <WorkTimeTracker sessions={dailyData?.sessions} status={dailyData?.status} />
                        </Paper>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default EmployeeDashboardPage;