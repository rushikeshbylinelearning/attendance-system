import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Button, CircularProgress, Alert, Chip, Box, Snackbar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import SaturdaySchedule from '../components/SaturdaySchedule';
import LeaveRequestForm from '../components/LeaveRequestForm';
import '../styles/Page.css';
import '../styles/LeavesPage.css'; 

const LeavesPage = () => {
    const { user } = useAuth();
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestType, setRequestType] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const fetchMyRequests = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/leaves/my-requests');
            setMyRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load your leave requests.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyRequests();
    }, [fetchMyRequests]);

    const handleOpenModal = (type) => {
        setRequestType(type);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setRequestType('');
    };

    const handleRequestSubmitted = () => {
        handleCloseModal();
        setSnackbar({ open: true, message: 'Your request has been submitted successfully!' });
        fetchMyRequests(); // Refresh the list
    };

    const statusColors = {
        Pending: 'warning',
        Approved: 'success',
        Rejected: 'error',
    };

    const columns = [
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => <Chip label={params.value} color={statusColors[params.value] || 'default'} size="small" />
        },
        { field: 'requestType', headerName: 'Request Type', width: 180 },
        { 
            field: 'leaveDates', 
            headerName: 'Requested Date', 
            width: 180,
            valueGetter: (value) => value && value.length > 0 ? new Date(value[0]).toLocaleDateString('en-CA') : 'N/A'
        },
        { 
            field: 'alternateDate', 
            headerName: 'Alternate Date', 
            width: 180,
            valueGetter: (value) => value ? new Date(value).toLocaleDateString('en-CA') : 'N/A'
        },
        { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 250 },
        { 
            field: 'createdAt', 
            headerName: 'Submitted On', 
            width: 200,
            valueGetter: (value) => new Date(value).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })
        },
    ];

    if (loading && myRequests.length === 0) {
        return <div className="loading-container"><CircularProgress /></div>;
    }

    return (
        <div className="dashboard-page leaves-page-container">
            <Typography variant="h4" gutterBottom>Leave & Work Request Management</Typography>
            {error && <Alert severity="error" className="page-error-alert">{error}</Alert>}

            <Box className="leaves-main-grid">
                <div className="card">
                    <div className="requests-header">
                        <Typography variant="h6">My Requests</Typography>
                        <Box className="request-actions">
                             <Button variant="contained" size="small" onClick={() => handleOpenModal('Swap')}>Request Swap</Button>
                             <Button variant="outlined" size="small" onClick={() => handleOpenModal('Voluntary Work')}>Request Voluntary</Button>
                             <Button variant="outlined" color="secondary" size="small" onClick={() => handleOpenModal('Compensation')}>Compensation</Button>
                        </Box>
                    </div>
                     <div className="datagrid-container">
                        <DataGrid
                            rows={myRequests}
                            columns={columns}
                            getRowId={(row) => row._id}
                            loading={loading}
                            initialState={{
                                sorting: {
                                    sortModel: [{ field: 'createdAt', sort: 'desc' }],
                                },
                            }}
                            density="compact"
                        />
                    </div>
                </div>
                {/* --- FIX: Pass the fetched requests to the component --- */}
                <SaturdaySchedule 
                    policy={user.alternateSaturdayPolicy} 
                    requests={myRequests} 
                />
            </Box>

            {isModalOpen && (
                <LeaveRequestForm
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    requestType={requestType}
                    onSubmitted={handleRequestSubmitted}
                />
            )}
             <Snackbar 
                open={snackbar.open} 
                autoHideDuration={5000} 
                onClose={() => setSnackbar({ open: false, message: '' })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                 <Alert onClose={() => setSnackbar({ open: false, message: '' })} severity="success" sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default LeavesPage;