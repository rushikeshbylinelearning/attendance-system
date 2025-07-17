// frontend/src/pages/EmployeesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Paper, CircularProgress, Alert, Chip, Select, MenuItem, Snackbar } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EmployeeForm from '../components/EmployeeForm';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [allShifts, setAllShifts] = useState([]); // State to hold all shifts for the dropdown
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [empsRes, shiftsRes] = await Promise.all([
                axios.get('/api/admin/employees'),
                axios.get('/api/admin/shifts')
            ]);
            setEmployees(empsRes.data);
            setAllShifts(shiftsRes.data);
        } catch (err) {
            setError('Failed to fetch initial data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleOpenForm = (employee = null) => { setSelectedEmployee(employee); setIsFormOpen(true); };
    const handleCloseForm = () => { setSelectedEmployee(null); setIsFormOpen(false); };
    
    const handleSaveEmployee = async (employeeData) => {
        try {
            if (selectedEmployee) {
                await axios.put(`/api/admin/employees/${selectedEmployee.id}`, employeeData);
                setSnackbar({ open: true, message: 'Employee updated successfully!', severity: 'success' });
            } else {
                await axios.post('/api/admin/employees', employeeData);
                setSnackbar({ open: true, message: 'Employee added successfully!', severity: 'success' });
            }
            handleCloseForm();
            fetchAllData(); // Use the combined fetch function
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save employee.', severity: 'error' });
        }
    };

    const handleShiftChange = async (employeeId, newShiftId) => {
        try {
            await axios.patch(`/api/admin/employees/${employeeId}/shift`, { shift_group_id: newShiftId });
            // Optimistic UI update
            setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, shift_group_id: newShiftId } : emp));
            setSnackbar({ open: true, message: 'Shift updated!', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to update shift.', severity: 'error' });
        }
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const columns = [
        { field: 'employee_code', headerName: 'Emp Code', width: 120 },
        { field: 'full_name', headerName: 'Full Name', flex: 1, minWidth: 180 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
        { field: 'role', headerName: 'Role', width: 120 },
        { 
            field: 'shift_group_id', 
            headerName: 'Shift', 
            width: 200,
            renderCell: (params) => (
                <Select
                    value={params.value || ''}
                    onChange={(e) => handleShiftChange(params.row.id, e.target.value)}
                    size="small"
                    sx={{ width: '100%' }}
                    onClick={(e) => e.stopPropagation()} // Prevent row selection on dropdown click
                >
                    {allShifts.map(shift => (
                        <MenuItem key={shift.id} value={shift.id}>{shift.shift_name}</MenuItem>
                    ))}
                </Select>
            )
        },
        { field: 'is_active', headerName: 'Status', width: 100, renderCell: (params) => (
            <Chip label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'error'} size="small" />
        )},
        { field: 'actions', headerName: 'Actions', width: 120, renderCell: (params) => (
            <Button variant="outlined" size="small" onClick={() => handleOpenForm(params.row)}>Details</Button>
        )},
    ];

    if (loading) return <CircularProgress />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Manage Employees</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>Add Employee</Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Paper sx={{ height: 650, width: '100%' }}>
                <DataGrid rows={employees} columns={columns} disableSelectionOnClick />
            </Paper>
            <EmployeeForm open={isFormOpen} onClose={handleCloseForm} onSave={handleSaveEmployee} employee={selectedEmployee} />
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EmployeesPage;