// frontend/src/pages/ShiftsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios'; // CORRECTED PATH
import { Typography, Button, CircularProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import ShiftForm from '../components/ShiftForm';
import '../styles/Page.css';

// ... (The rest of the component code is correct and does not need changes)
const ShiftsPage = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, shift: null });

    const fetchShifts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/shifts');
            setShifts(data);
        } catch (err) {
            setError('Failed to fetch shifts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchShifts(); }, [fetchShifts]);

    const handleOpenForm = (shift = null) => {
        setSelectedShift(shift);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedShift(null);
        setIsFormOpen(false);
    };

    const handleSaveShift = async (formData) => {
        try {
            if (selectedShift) {
                await api.put(`/admin/shifts/${selectedShift._id}`, formData);
                setSnackbar({ open: true, message: 'Shift updated successfully!', severity: 'success' });
            } else {
                await api.post('/admin/shifts', formData);
                setSnackbar({ open: true, message: 'Shift added successfully!', severity: 'success' });
            }
            handleCloseForm();
            await fetchShifts();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save shift.', severity: 'error' });
        }
    };

    const confirmDeleteShift = async () => {
        const shift = deleteDialog.shift;
        if (!shift) return;
        try {
            await api.delete(`/admin/shifts/${shift._id}`);
            setSnackbar({ open: true, message: 'Shift deleted successfully!', severity: 'success' });
            setDeleteDialog({ open: false, shift: null });
            await fetchShifts();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to delete shift.', severity: 'error' });
            setDeleteDialog({ open: false, shift: null });
        }
    };
    
    const columns = [
        { field: 'shiftName', headerName: 'Name', flex: 1, minWidth: 180 },
        { field: 'shiftType', headerName: 'Type', width: 120 },
        { field: 'startTime', headerName: 'Start Time', width: 120, valueFormatter: (value) => value ? new Date(`1970-01-01T${value}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A' },
        { field: 'endTime', headerName: 'End Time', width: 120, valueFormatter: (value) => value ? new Date(`1970-01-01T${value}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A' },
        { field: 'durationHours', headerName: 'Duration (Hrs)', width: 150, align: 'center', headerAlign: 'center' },
        { field: 'paidBreakMinutes', headerName: 'Paid Break (Mins)', width: 160, align: 'center', headerAlign: 'center' },
        { 
            field: 'actions', headerName: 'Actions', width: 180, sortable: false,
            renderCell: (params) => (
                <>
                    <Button variant="outlined" size="small" onClick={() => handleOpenForm(params.row)} style={{ marginRight: 8 }}>Edit</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => setDeleteDialog({ open: true, shift: params.row })}>Delete</Button>
                </>
            )
        },
    ];
    
    if (loading) return <div className="flex-center" style={{ height: '60vh' }}><CircularProgress /></div>;

    return (
        <div className="dashboard-page" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <div className="dashboard-header" style={{ marginBottom: 24 }}>
                <Typography variant="h4">Manage Shifts</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>Add Shift</Button>
            </div>
            {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
            <div className="card" style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
                <DataGrid 
                    rows={shifts} 
                    columns={columns} 
                    getRowId={(row) => row._id}
                    disableRowSelectionOnClick 
                />
            </div>
            <ShiftForm open={isFormOpen} onClose={handleCloseForm} onSave={handleSaveShift} shift={selectedShift} />
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, shift: null })}>
                <DialogTitle>Delete Shift</DialogTitle>
                <DialogContent>Are you sure you want to delete shift <b>{deleteDialog.shift?.shiftName}</b>?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, shift: null })}>Cancel</Button>
                    <Button onClick={confirmDeleteShift} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
};

export default ShiftsPage;