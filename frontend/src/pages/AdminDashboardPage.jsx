// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Box, Paper, Grid, CircularProgress, Alert, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import GroupIcon from '@mui/icons-material/Group';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkIcon from '@mui/icons-material/Work';

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await axios.get('/api/admin/dashboard-summary');
                setSummary(data);
            } catch (err) {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
        // Optional: Set an interval to refresh the data every minute
        const intervalId = setInterval(fetchSummary, 60000);
        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, []);

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>Admin Dashboard</Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Welcome, {user.name}! Here's a summary of today's activity.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {summary && (
                <Grid container spacing={3}>
                    {/* Stat Cards */}
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                            <WorkIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="h6">{summary.present_count || 0} / {summary.total_employees || 0}</Typography>
                                <Typography color="text.secondary">Employees Present</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                            <AccessAlarmIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="h6">{summary.late_count || 0}</Typography>
                                <Typography color="text.secondary">Late Comers</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                            <EventBusyIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                            <Box>
                                <Typography variant="h6">{summary.on_leave_count || 0}</Typography>
                                <Typography color="text.secondary">On Leave</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                    
                    {/* "Who's In Today?" List */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, height: '400px', overflowY: 'auto' }}>
                            <Typography variant="h6">Who's In Today?</Typography>
                            <List>
                                {summary.whos_in_list && summary.whos_in_list.length > 0 ? (
                                    summary.whos_in_list.map((emp, index) => (
                                        <React.Fragment key={emp.id}>
                                            <ListItem>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: 'primary.light' }}>{emp.full_name.charAt(0)}</Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={emp.full_name}
                                                    secondary={emp.designation}
                                                />
                                                <Typography variant="body2" color="text.secondary">
                                                    In since {new Date(emp.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </Typography>
                                            </ListItem>
                                            {index < summary.whos_in_list.length - 1 && <Divider variant="inset" component="li" />}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <Typography sx={{ p: 2, textAlign: 'center' }} color="text.secondary">No employees are currently clocked in.</Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Pending Requests Placeholder */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, height: '400px' }}>
                            <Typography variant="h6">Pending Requests</Typography>
                             <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>(Leave/Comp-off requests will appear here)</Typography>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default AdminDashboardPage;