// frontend/src/pages/ShiftsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Paper, CircularProgress, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import ShiftForm from '../components/ShiftForm';

// Helper function for consistent time display
const formatTimeTo12Hour = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return new Date(1970, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });
};

const ShiftsPage = () => {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);

    const fetchShifts = useCallback(async () => { /* ... no change ... */ });
    useEffect(() => { fetchShifts(); }, [fetchShifts]);
    const handleOpenForm = (shift = null) => { /* ... no change ... */ };
    const handleCloseForm = () => { /* ... no change ... */ };
    const handleSaveShift = async (formData) => { /* ... no change ... */ };

    const columns = [
        { field: 'shift_name', headerName: 'Name', width: 200 },
        { field: 'shift_type', headerName: 'Type', width: 120 },
        { field: 'start_time', headerName: 'Start Time', width: 120, valueFormatter: (params) => formatTimeTo12Hour(params.value) },
        { field: 'end_time', headerName: 'End Time', width: 120, valueFormatter: (params) => formatTimeTo12Hour(params.value) },
        { field: 'duration_hours', headerName: 'Duration (Hrs)', width: 150 },
        { field: 'paid_break_minutes', headerName: 'Paid Break (Mins)', width: 150 },
        { field: 'actions', headerName: 'Actions', width: 120, renderCell: (params) => (<Button variant="outlined" size="small" onClick={() => handleOpenForm(params.row)}>Edit</Button>)},
    ];
    
    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Manage Shifts</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>Add Shift</Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper sx={{ height: 600, width: '100%' }}><DataGrid rows={shifts} columns={columns} /></Paper>
            <ShiftForm open={isFormOpen} onClose={handleCloseForm} onSave={handleSaveShift} shift={selectedShift} />
        </Box>
    );
};
export default ShiftsPage;