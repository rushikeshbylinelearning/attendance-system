// frontend/src/components/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

const EmployeeForm = ({ open, onClose, onSave, employee }) => {
    const [formData, setFormData] = useState({});
    const [shifts, setShifts] = useState([]);
    const isEditing = Boolean(employee);

    useEffect(() => {
        // If an employee object is passed, we are in "edit" mode
        if (isEditing) {
            setFormData({ ...employee, joining_date: employee.joining_date.split('T')[0] }); // Format date for input
        } else {
            // Otherwise, we are in "add" mode, so reset the form
            setFormData({
                employee_code: '', full_name: '', email: '', password: '', role: 'Employee',
                designation: '', department: '', joining_date: '', shift_group_id: '', is_active: true
            });
        }
    }, [employee, open]);

    useEffect(() => {
        // Fetch shifts for the dropdown
        const fetchShifts = async () => {
            const { data } = await axios.get('/api/admin/shifts');
            setShifts(data);
        };
        fetchShifts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{isEditing ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2} sx={{mt: 1}}>
                        <Grid item xs={12} sm={6}><TextField name="full_name" label="Full Name" value={formData.full_name || ''} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="employee_code" label="Employee Code" value={formData.employee_code || ''} onChange={handleChange} fullWidth required /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="email" type="email" label="Email Address" value={formData.email || ''} onChange={handleChange} fullWidth required /></Grid>
                        {!isEditing && <Grid item xs={12} sm={6}><TextField name="password" type="password" label="Password" value={formData.password || ''} onChange={handleChange} fullWidth required /></Grid>}
                        <Grid item xs={12} sm={6}><TextField name="designation" label="Designation" value={formData.designation || ''} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}><TextField name="department" label="Department" value={formData.department || ''} onChange={handleChange} fullWidth /></Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth><InputLabel>Role</InputLabel>
                                <Select name="role" label="Role" value={formData.role || 'Employee'} onChange={handleChange}>
                                    <MenuItem value="Employee">Employee</MenuItem><MenuItem value="Intern">Intern</MenuItem><MenuItem value="HR">HR</MenuItem><MenuItem value="Admin">Admin</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth><InputLabel>Shift</InputLabel>
                                <Select name="shift_group_id" label="Shift" value={formData.shift_group_id || ''} onChange={handleChange} required>
                                    {shifts.map(shift => <MenuItem key={shift.id} value={shift.id}>{shift.shift_name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}><TextField name="joining_date" label="Joining Date" type="date" value={formData.joining_date || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth required /></Grid>
                        {isEditing && <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Status</InputLabel><Select name="is_active" label="Status" value={formData.is_active} onChange={handleChange}><MenuItem value={true}>Active</MenuItem><MenuItem value={false}>Inactive</MenuItem></Select></FormControl></Grid>}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained">Save</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EmployeeForm;