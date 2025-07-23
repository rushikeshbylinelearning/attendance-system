import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid,
    Select, MenuItem, InputLabel, FormControl, CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const initialFormState = {
    employee: '',
    requestType: 'Swap',
    leaveDates: [null],
    alternateDate: null,
    reason: '',
    status: 'Pending',
};

const AdminLeaveForm = ({ open, onClose, onSave, request, employees }) => {
    const [formData, setFormData] = useState(initialFormState);
    const isEditing = !!request;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                _id: request._id,
                employee: request.employee?._id || '',
                requestType: request.requestType || 'Swap',
                leaveDates: request.leaveDates?.map(d => new Date(d)) || [null],
                alternateDate: request.alternateDate ? new Date(request.alternateDate) : null,
                reason: request.reason || '',
                status: request.status || 'Pending',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [request, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, leaveDates: [date] }));
    };

    const handleAlternateDateChange = (date) => {
        setFormData(prev => ({ ...prev, alternateDate: date }));
    };

    const handleSaveClick = () => {
        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEditing ? 'Edit Leave Request' : 'Log New Leave Request'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Employee</InputLabel>
                            <Select name="employee" label="Employee" value={formData.employee} onChange={handleChange}>
                                {employees.map(emp => (
                                    <MenuItem key={emp._id} value={emp._id}>{emp.fullName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                     <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Request Type</InputLabel>
                            <Select name="requestType" label="Request Type" value={formData.requestType} onChange={handleChange}>
                                <MenuItem value="Swap">Swap</MenuItem>
                                <MenuItem value="Voluntary Work">Voluntary Work</MenuItem>
                                <MenuItem value="Compensation">Compensation</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <DatePicker label="Leave Date" value={formData.leaveDates[0]} onChange={handleDateChange} slotProps={{ textField: { fullWidth: true } }} />
                    </Grid>
                    {formData.requestType === 'Swap' &&
                        <Grid item xs={12}>
                            <DatePicker label="Alternate Date" value={formData.alternateDate} onChange={handleAlternateDateChange} slotProps={{ textField: { fullWidth: true } }} />
                        </Grid>
                    }
                    <Grid item xs={12}>
                        <TextField name="reason" label="Reason" multiline rows={3} value={formData.reason} onChange={handleChange} fullWidth required />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Status</InputLabel>
                            <Select name="status" label="Status" value={formData.status} onChange={handleChange}>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Approved">Approved</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSaveClick} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdminLeaveForm;