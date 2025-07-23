// frontend/src/components/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    Select, MenuItem, InputLabel, FormControl
} from '@mui/material';

const initialFormState = {
    employeeCode: '',
    fullName: '',
    email: '',
    password: '',
    role: 'Employee',
    designation: '',
    department: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    shiftGroup: '',
    isActive: true,
    alternateSaturdayPolicy: 'All Saturdays Working',
};

const roles = ['Admin', 'HR', 'Employee', 'Intern'];
const satPolicies = ['Week 1 & 3 Off', 'Week 2 & 4 Off', 'All Saturdays Working', 'All Saturdays Off'];

const EmployeeForm = ({ open, onClose, onSave, employee, shifts }) => {
    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});

    const isEditing = !!employee;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                employeeCode: employee.employeeCode || '',
                fullName: employee.fullName || '',
                email: employee.email || '',
                password: '',
                role: employee.role || 'Employee',
                designation: employee.designation || '',
                department: employee.department || '',
                joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().slice(0, 10) : '',
                shiftGroup: employee.shiftGroup?._id || '',
                isActive: employee.isActive,
                alternateSaturdayPolicy: employee.alternateSaturdayPolicy || 'All Saturdays Working',
            });
        } else {
            setFormData(initialFormState);
        }
        setErrors({});
    }, [employee, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        let tempErrors = {};
        if (!formData.employeeCode) tempErrors.employeeCode = "Employee Code is required.";
        if (!formData.fullName) tempErrors.fullName = "Full Name is required.";
        if (!formData.email) tempErrors.email = "Email is required.";
        if (!isEditing && !formData.password) tempErrors.password = "Password is required for new employees.";
        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            const dataToSave = { ...formData };
            if (!dataToSave.password) {
                delete dataToSave.password;
            }
            onSave(dataToSave);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{isEditing ? 'Edit Employee Details' : 'Add New Employee'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}><TextField name="fullName" label="Full Name" value={formData.fullName} onChange={handleChange} fullWidth required error={!!errors.fullName} helperText={errors.fullName} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="employeeCode" label="Employee Code" value={formData.employeeCode} onChange={handleChange} fullWidth required error={!!errors.employeeCode} helperText={errors.employeeCode} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} fullWidth required error={!!errors.email} helperText={errors.email} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="password" label="Password" type="password" value={formData.password} onChange={handleChange} fullWidth required={!isEditing} helperText={isEditing ? "Leave blank to keep current password" : "Required for new employee"} error={!!errors.password} /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="designation" label="Designation" value={formData.designation} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="department" label="Department" value={formData.department} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField name="joiningDate" label="Joining Date" type="date" value={formData.joiningDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Role</InputLabel><Select name="role" label="Role" value={formData.role} onChange={handleChange}>{roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}</Select></FormControl></Grid>
                    <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Shift Group</InputLabel><Select name="shiftGroup" label="Shift Group" value={formData.shiftGroup} onChange={handleChange}><MenuItem value=""><em>None</em></MenuItem>{shifts.map(s => <MenuItem key={s._id} value={s._id}>{s.shiftName}</MenuItem>)}</Select></FormControl></Grid>
                    {/* NEW FIELD */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Alternate Saturday Policy</InputLabel>
                            <Select name="alternateSaturdayPolicy" label="Alternate Saturday Policy" value={formData.alternateSaturdayPolicy} onChange={handleChange}>
                                {satPolicies.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EmployeeForm;