import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Typography, Button, CircularProgress, Alert, Chip, Box, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminLeaveForm from '../components/AdminLeaveForm'; // Import the new form
import '../styles/Page.css';

const AdminLeavesPage = () => {
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, request: null });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [reqRes, empRes] = await Promise.all([
                api.get('/admin/leaves/all'),
                api.get('/admin/employees')
            ]);
            setRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
            setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        } catch (err) {
            setError('Failed to fetch leave management data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleOpenForm = (request = null) => {
        setSelectedRequest(request);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedRequest(null);
        setIsFormOpen(false);
    };

    const handleSaveRequest = async (formData) => {
        try {
            if (formData._id) { // Editing an existing request
                await api.put(`/admin/leaves/${formData._id}`, formData);
                setSnackbar({ open: true, message: 'Request updated successfully!', severity: 'success' });
            } else { // Creating a new request
                await api.post('/admin/leaves', formData);
                setSnackbar({ open: true, message: 'Request created successfully!', severity: 'success' });
            }
            handleCloseForm();
            await fetchAllData();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save request.', severity: 'error' });
        }
    };

    const handleDelete = (request) => {
        setDeleteDialog({ open: true, request });
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/admin/leaves/${deleteDialog.request._id}`);
            setSnackbar({ open: true, message: 'Request deleted!', severity: 'success' });
            setDeleteDialog({ open: false, request: null });
            await fetchAllData();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to delete request.', severity: 'error' });
        }
    };
    
    const statusColors = { Pending: 'warning', Approved: 'success', Rejected: 'error' };

    const columns = [
        { field: 'employeeName', headerName: 'Employee', width: 200, valueGetter: (value, row) => row.employee?.fullName || 'N/A' },
        { field: 'requestType', headerName: 'Type', width: 150 },
        { field: 'leaveDates', headerName: 'Date', width: 120, valueGetter: (value) => value && value.length > 0 ? new Date(value[0]).toLocaleDateString('en-CA') : '' },
        { field: 'alternateDate', headerName: 'Alternate', width: 120, valueGetter: (value) => value ? new Date(value).toLocaleDateString('en-CA') : '' },
        { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 200 },
        { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => <Chip label={params.value} color={statusColors[params.value] || 'default'} size="small" /> },
        {
            field: 'actions', headerName: 'Actions', width: 150, sortable: false,
            renderCell: (params) => (
                <Box>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenForm(params.row)}>Edit</Button>
                    <Button size="small" startIcon={<DeleteIcon />} color="error" onClick={() => handleDelete(params.row)}>Delete</Button>
                </Box>
            )
        }
    ];

    if (loading) return <div className="flex-center" style={{ height: '60vh' }}><CircularProgress /></div>;

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <Typography variant="h4">Leave Request Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>Log Leave</Button>
            </div>
            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
            <div className="card" style={{ height: 'calc(100vh - 200px)', width: '100%', marginTop: '24px' }}>
                <DataGrid
                    rows={requests}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    density="compact"
                />
            </div>

            {isFormOpen && (
                <AdminLeaveForm
                    open={isFormOpen}
                    onClose={handleCloseForm}
                    onSave={handleSaveRequest}
                    request={selectedRequest}
                    employees={employees}
                />
            )}

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, request: null })}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>Are you sure you want to delete this leave request?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, request: null })}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
};

export default AdminLeavesPage;