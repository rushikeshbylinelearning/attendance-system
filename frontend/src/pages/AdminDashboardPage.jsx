// frontend/src/pages/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // CORRECTED PATH
import { Typography, CircularProgress, Alert, Avatar, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import WorkIcon from '@mui/icons-material/Work';
import '../styles/Page.css';

// ... (The rest of the component code is correct and does not need changes)
const AdminDashboardPage = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await api.get('/admin/dashboard-summary');
                setSummary(data);
            } catch (err) {
                setError('Failed to load dashboard data. Please try again later.');
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
        const intervalId = setInterval(fetchSummary, 60000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <div className="flex-center" style={{ height: '60vh' }}><CircularProgress /></div>;

    return (
        <div className="dashboard-page">
            <div className="dashboard-header"><Typography variant="h4" gutterBottom>Admin Dashboard</Typography></div>
            <Typography variant="h6" color="text.secondary" style={{ marginBottom: 24 }}>Welcome, {user.name}! Here's a summary of today's activity.</Typography>
            {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
            {summary && (
                <div className="dashboard-widgets gap-16" style={{ flexWrap: 'wrap', alignItems: 'stretch' }}>
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
                    <div className="card" style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6" style={{ marginBottom: 8 }}>Who's In Today?</Typography>
                        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                            {summary.whosInList && summary.whosInList.length > 0 ? (
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
                    <div className="card" style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography variant="h6">Pending Requests</Typography>
                        <div className="flex-center" style={{ flex: 1, minHeight: 120 }}>
                            <Typography className="text-muted" style={{ textAlign: 'center', padding: 16 }}>(Leave/Comp-off requests will appear here)</Typography>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminDashboardPage;