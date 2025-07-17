// frontend/src/pages/EmployeeLogViewer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Button, Grid, Stack, Divider, Chip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FreeBreakfastIcon from '@mui/icons-material/FreeBreakfast';

// Helper function for formatting time
const formatTime = (timeString) => {
    if (!timeString) return 'Active';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// A new component for displaying a single day's detailed log card
const DayLogCard = ({ log }) => {
    const totalWorkMinutes = (log.sessions || []).reduce((acc, session) => {
        if (session.start_time && session.end_time) {
            return acc + (new Date(session.end_time) - new Date(session.start_time));
        }
        return acc;
    }, 0) / (1000 * 60);

    const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    {new Date(log.attendance_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Typography>
                <Chip label={`Total Work: ${formatDuration(totalWorkMinutes)}`} color="primary" />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Grid container spacing={2}>
                {/* Work Sessions Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}><AccessTimeIcon sx={{mr: 1}} /> Work Sessions</Typography>
                        {(log.sessions && log.sessions[0] !== null) ? log.sessions.map((s, i) => (
                             <Paper key={`s-${i}`} variant="outlined" sx={{p: 1, bgcolor: 'action.hover'}}>
                                <Typography variant="body2"><strong>In:</strong> {formatTime(s.start_time)} | <strong>Out:</strong> {formatTime(s.end_time)}</Typography>
                            </Paper>
                        )) : <Typography variant="body2" color="text.secondary">No work sessions recorded.</Typography>}
                    </Stack>
                </Grid>
                {/* Break Sessions Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}><FreeBreakfastIcon sx={{mr: 1}} /> Breaks</Typography>
                         {(log.breaks && log.breaks[0] !== null) ? log.breaks.map((b, i) => (
                             <Paper key={`b-${i}`} variant="outlined" sx={{p: 1}}>
                                <Typography variant="body2"><strong>Start:</strong> {formatTime(b.start_time)} | <strong>End:</strong> {formatTime(b.end_time)}</Typography>
                                <Typography variant="caption" color="text.secondary">Duration: {b.duration} mins | Type: {b.type}</Typography>
                            </Paper>
                        )) : <Typography variant="body2" color="text.secondary">No breaks recorded.</Typography>}
                    </Stack>
                </Grid>
            </Grid>
        </Paper>
    );
};

const EmployeeLogViewer = () => {
    const [employees, setEmployees] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const { data } = await axios.get('/api/admin/employees');
                if (Array.isArray(data)) setEmployees(data);
            } catch (err) { setError('Could not load the employee list.'); }
        };
        fetchEmployees();
    }, []);

    const handleSearch = async () => {
        if (!selectedEmployee || !startDate || !endDate) {
            setError('Please select an employee and a valid date range.'); return;
        }
        setError(''); setLoading(true); setSearched(true);
        try {
            const params = { employeeId: selectedEmployee, startDate: startDate.toISOString().slice(0, 10), endDate: endDate.toISOString().slice(0, 10) };
            const { data } = await axios.get('/api/admin/attendance-logs', { params });
            if (Array.isArray(data)) setLogs(data);
        } catch (err) { setError('Failed to fetch logs.'); }
        finally { setLoading(false); }
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>Employee Log Viewer</Typography>
            <Paper sx={{ p: 2, position: 'sticky', top: '70px', zIndex: 1000 }}>
                {/* ... (Filter Grid remains the same) ... */}
                 <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>Employee</InputLabel><Select value={selectedEmployee} label="Employee" onChange={e => setSelectedEmployee(e.target.value)}>{employees.map(emp => (<MenuItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</MenuItem>))}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={6} md={3}><DatePicker label="Start Date" value={startDate} onChange={setStartDate} sx={{ width: '100%' }} /></Grid>
                    <Grid item xs={12} sm={6} md={3}><DatePicker label="End Date" value={endDate} onChange={setEndDate} sx={{ width: '100%' }} /></Grid>
                    <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={handleSearch} disabled={loading} sx={{height: '56px'}}>{loading ? <CircularProgress size={24} /> : 'Search'}</Button></Grid>
                </Grid>
                 {error && <Alert severity="warning" sx={{mt: 2}}>{error}</Alert>}
            </Paper>

            <Box sx={{ mt: 3 }}>
                {loading ? <Box sx={{textAlign: 'center'}}><CircularProgress /></Box> :
                    searched && (
                        logs.length > 0 ? (
                            logs.map(log => <DayLogCard key={log.id} log={log} />)
                        ) : (
                            <Paper sx={{p: 3, textAlign: 'center'}}><Typography>No attendance data found for the selected criteria.</Typography></Paper>
                        )
                    )
                }
            </Box>
        </Box>
    );
};

export default EmployeeLogViewer;