import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Typography, CircularProgress, Alert, Avatar, Divider, Button, Tooltip, Snackbar, Chip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkIcon from '@mui/icons-material/Work';
import '../styles/Page.css';

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const fetchAllData = useCallback(async () => {
        try {
            const [summaryRes, requestsRes] = await Promise.all([
                api.get('/admin/dashboard-summary'),
                api.get('/admin/leaves/pending')
            ]);
            setSummary(summaryRes.data);
            setPendingRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
        } catch (err) {
            setError('Failed to load dashboard data. Please try again later.');
            console.error("Dashboard fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
        const intervalId = setInterval(fetchAllData, 60000); // Refresh every minute
        return () => clearInterval(intervalId);
    }, [fetchAllData]);

    const handleRequestStatusChange = async (requestId, status) => {
        try {
            await api.patch(`/admin/leaves/${requestId}/status`, { status });
            setSnackbar({ open: true, message: `Request has been ${status.toLowerCase()}.` });
            fetchAllData(); // Refresh data after action
        } catch (err) {
            setError(err.response?.data?.error || 'Action failed.');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '60vh' }}><CircularProgress /></div>;

    return (
        <div className="dashboard-page">
            <div className="dashboard-header"><Typography variant="h4" gutterBottom>Admin Dashboard</Typography></div>
            <Typography variant="h6" color="text.secondary" style={{ marginBottom: 24 }}>Welcome, {user.name}! Here's a summary of today's activity.</Typography>
            {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
            
            {/* Summary Widgets */}
            {summary && (
                 <div className="dashboard-widgets gap-16" style={{ alignItems: 'flex-start' }}>
                    <div className="card" style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <WorkIcon color="primary" style={{ fontSize: 40, marginRight: 12 }} />
                        <div>
                            <Typography variant="h6">{summary.presentCount || 0} / {summary.totalEmployees || 0}</Typography>
                            <Typography className="text-muted">Employees Present</Typography>
                        </div>
                    </div>
                    <div className="card" style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <AccessAlarmIcon color="error" style={{ fontSize: 40, marginRight: 12 }} />
                        <div>
                            <Typography variant="h6">{summary.lateCount || 0}</Typography>
                            <Typography className="text-muted">Late Comers</Typography>
                        </div>
                    </div>
                    <div className="card" style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <EventBusyIcon color="secondary" style={{ fontSize: 40, marginRight: 12 }} />
                        <div>
                            <Typography variant="h6">{summary.onLeaveCount || 0}</Typography>
                            <Typography className="text-muted">On Leave</Typography>
                        </div>
                    </div>
                 </div>
            )}

            <div className="dashboard-widgets gap-16" style={{ marginTop: 24, alignItems: 'flex-start' }}>
                {/* Who's In List */}
                <div className="card" style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" style={{ marginBottom: 8 }}>Who's In Today?</Typography>
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {summary?.whosInList?.length > 0 ? (
                            summary.whosInList.map((emp, index) => (
                                <React.Fragment key={emp.id}>
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                                        <Avatar style={{ background: '#e3eafe', color: '#2563eb', marginRight: 12 }}>{emp.fullName.charAt(0)}</Avatar>
                                        <div style={{ flex: 1 }}>
                                            <Typography variant="body1">{emp.fullName}</Typography>
                                            <Typography variant="body2" className="text-muted">{emp.designation}</Typography>
                                        </div>
                                        <Typography variant="body2" className="text-muted">In since {new Date(emp.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Typography>
                                    </div>
                                    {index < summary.whosInList.length - 1 && <Divider style={{ margin: '0 0 0 48px' }} />}
                                </React.Fragment>
                            ))
                        ) : (
                            <Typography style={{ padding: 16, textAlign: 'center' }} className="text-muted">No employees are currently clocked in.</Typography>
                        )}
                    </div>
                </div>

                {/* Pending Requests List */}
                <div className="card" style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" style={{ marginBottom: 8 }}>Pending Leave Requests</Typography>
                     <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {pendingRequests.length > 0 ? (
                            pendingRequests.map((req, index) => (
                                <React.Fragment key={req._id}>
                                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 0', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            {/* --- THIS IS THE FIX --- */}
                                            {/* Changed component from the default 'p' to a 'div' to allow nesting a Chip */}
                                            <Typography variant="body1" component="div">
                                                <strong>{req.employee.fullName}</strong>
                                                <Chip label={req.requestType} size="small" sx={{ ml: 1 }} />
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Date: {new Date(req.leaveDates[0]).toLocaleDateString()}
                                                {req.alternateDate && ` | Alternate: ${new Date(req.alternateDate).toLocaleDateString()}`}
                                            </Typography>
                                            <Tooltip title={req.reason}>
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                                                    {req.reason.substring(0, 50)}{req.reason.length > 50 && '...'}
                                                </Typography>
                                            </Tooltip>
                                        </div>
                                        <div>
                                            <Button size="small" variant="contained" color="success" sx={{ mr: 1 }} onClick={() => handleRequestStatusChange(req._id, 'Approved')}>Approve</Button>
                                            <Button size="small" variant="outlined" color="error" onClick={() => handleRequestStatusChange(req._id, 'Rejected')}>Reject</Button>
                                        </div>
                                    </div>
                                     {index < pendingRequests.length - 1 && <Divider />}
                                </React.Fragment>
                            ))
                        ) : (
                             <div className="flex-center" style={{ flex: 1, minHeight: 120 }}>
                                <Typography className="text-muted">(No pending leave or work requests)</Typography>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
        </div>
    );
};
export default AdminDashboardPage;