// frontend/src/pages/EmployeesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Typography, Button, CircularProgress, Alert, Chip, Select, MenuItem, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EmployeeForm from '../components/EmployeeForm';
import '../styles/Page.css';

const EmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [allShifts, setAllShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, employee: null });

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            const [empsRes, shiftsRes] = await Promise.all([
                api.get('/admin/employees'),
                api.get('/admin/shifts')
            ]);
            setEmployees(Array.isArray(empsRes.data) ? empsRes.data : []);
            setAllShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleOpenForm = (employee = null) => {
        setSelectedEmployee(employee);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setSelectedEmployee(null);
        setIsFormOpen(false);
    };

    const handleSaveEmployee = async (employeeData) => {
        try {
            if (selectedEmployee) {
                await api.put(`/admin/employees/${selectedEmployee._id}`, employeeData);
                setSnackbar({ open: true, message: 'Employee updated successfully!', severity: 'success' });
            } else {
                await api.post('/admin/employees', employeeData);
                setSnackbar({ open: true, message: 'Employee added successfully!', severity: 'success' });
            }
            handleCloseForm();
            await fetchAllData();
        } catch (err)
        {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to save employee.', severity: 'error' });
        }
    };
    
    const handleShiftChange = async (employeeId, newShiftId) => {
        const originalEmployees = [...employees];
        const shiftGroupIdToSend = newShiftId || null;

        setEmployees(prev => prev.map(emp => emp._id === employeeId ? { ...emp, shiftGroup: allShifts.find(s => s._id === newShiftId) || null } : emp));
        try {
            await api.patch(`/admin/employees/${employeeId}/shift`, { shiftGroup: shiftGroupIdToSend });
            setSnackbar({ open: true, message: 'Shift updated!', severity: 'success' });
        } catch (err) {
            setEmployees(originalEmployees);
            setSnackbar({ open: true, message: 'Failed to update shift.', severity: 'error' });
        }
    };

    const confirmDeleteEmployee = async () => {
        const employeeToDelete = deleteDialog.employee;
        if (!employeeToDelete) return;
        try {
            await api.delete(`/admin/employees/${employeeToDelete._id}`);
            setSnackbar({ open: true, message: 'Employee deleted successfully!', severity: 'success' });
            setDeleteDialog({ open: false, employee: null });
            await fetchAllData();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to delete employee.', severity: 'error' });
            setDeleteDialog({ open: false, employee: null });
        }
    };
    
    const columns = [
        { field: 'employeeCode', headerName: 'Emp Code', width: 120 },
        { field: 'fullName', headerName: 'Full Name', flex: 1, minWidth: 180 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
        { field: 'role', headerName: 'Role', width: 120 },
        {
            field: 'shiftGroup', headerName: 'Shift', width: 200,
            // --- BUG FIX ---
            // The valueGetter's first argument is the direct value of the cell.
            // Here, `value` is the shiftGroup object itself.
            valueGetter: (value) => value?.shiftName || 'Unassigned',
            renderCell: (params) => (
                <Select value={params.row.shiftGroup?._id || ''} onChange={(e) => handleShiftChange(params.row._id, e.target.value)} size="small" sx={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
                    <MenuItem value="">
                        <em>Unassigned</em>
                    </MenuItem>
                    {allShifts.map(shift => ( <MenuItem key={shift._id} value={shift._id}>{shift.shiftName}</MenuItem> ))}
                </Select>
            )
        },
        {
            field: 'alternateSaturdayPolicy',
            headerName: 'Saturday Policy',
            flex: 1,
            minWidth: 180,
            // --- BUG FIX ---
            // The valueGetter's first argument is the direct value of the cell.
            // Here, `value` is the policy string.
            valueGetter: (value) => value || 'All Saturdays Working',
        },
        { field: 'isActive', headerName: 'Status', width: 100, renderCell: (params) => <Chip label={params.value ? 'Active' : 'Inactive'} color={params.value ? 'success' : 'error'} size="small" /> },
        {
            field: 'actions', headerName: 'Actions', width: 180, sortable: false,
            renderCell: (params) => (
                <>
                    <Button variant="outlined" size="small" onClick={() => handleOpenForm(params.row)} style={{ marginRight: 8 }}>Details</Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => setDeleteDialog({ open: true, employee: params.row })}>Delete</Button>
                </>
            )
        },
    ];

    if (loading) return <div className="flex-center" style={{ height: '60vh' }}><CircularProgress /></div>;

    return (
        <div className="dashboard-page" style={{ minHeight: 'calc(100vh - 64px)' }}>
            <div className="dashboard-header" style={{ marginBottom: 24 }}>
                <Typography variant="h4">Manage Employees</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>Add Employee</Button>
            </div>
            {error && <Alert severity="error" style={{ marginBottom: 16 }}>{error}</Alert>}
            <div className="card" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
                <DataGrid rows={employees} columns={columns} getRowId={(row) => row._id} disableRowSelectionOnClick />
            </div>
            <EmployeeForm open={isFormOpen} onClose={handleCloseForm} onSave={handleSaveEmployee} employee={selectedEmployee} shifts={allShifts} />
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, employee: null })}>
                <DialogTitle>Delete Employee</DialogTitle>
                <DialogContent>Are you sure you want to delete employee <b>{deleteDialog.employee?.fullName}</b>?</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, employee: null })}>Cancel</Button>
                    <Button onClick={confirmDeleteEmployee} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">{snackbar.message}</Alert>
            </Snackbar>
        </div>
    );
};
export default EmployeesPage;