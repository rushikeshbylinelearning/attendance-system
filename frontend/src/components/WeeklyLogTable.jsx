// frontend/src/components/WeeklyLogTable.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
    CircularProgress, Alert, Chip, Collapse, IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LogDisplayTable from './LogDisplayTable';

const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const Row = ({ row }) => {
    const [open, setOpen] = useState(false);

    const totalWorkMinutes = (row.sessions || []).reduce((acc, session) => {
        if (session.start_time && session.end_time) {
            return acc + (new Date(session.end_time) - new Date(session.start_time));
        }
        return acc;
    }, 0) / (1000 * 60);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    {new Date(row.attendance_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell><Chip label={row.status} color={row.status === 'Present' ? 'success' : 'warning'} size="small" /></TableCell>
                <TableCell align="right">{Math.floor(totalWorkMinutes / 60)}h {Math.round(totalWorkMinutes % 60)}m</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">Details</Typography>
                            <Box>
                                <Typography variant="subtitle2">Work Sessions</Typography>
                                {(row.sessions || []).map((s, i) => (
                                    <Typography key={i} variant="body2" color="text.secondary">
                                        • {formatTime(s.start_time)} - {formatTime(s.end_time) || 'Active'}
                                    </Typography>
                                ))}
                            </Box>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2">Breaks Taken</Typography>
                                {(row.breaks || []).map((b, i) => (
                                    <Typography key={i} variant="body2" color="text.secondary">
                                        • {formatTime(b.start_time)} - {formatTime(b.end_time)} ({b.duration}m, {b.type})
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

const WeeklyLogTable = () => {
    const [logs, setLogs] = useState(null); // Initialize to null to better handle loading state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await axios.get('/api/attendance/my-weekly-log');
                setLogs(data);
            } catch (err) {
                setError('Could not fetch weekly logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    return (
        <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>My Weekly Log</Typography>
            {loading && <Box sx={{textAlign: 'center', p: 2}}><CircularProgress /></Box>}
            {error && <Alert severity="error">{error}</Alert>}
            {logs && <LogDisplayTable logs={logs} />}
        </Paper>
    );
};

export default WeeklyLogTable;