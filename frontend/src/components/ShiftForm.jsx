import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

const ShiftForm = ({ open, onClose, onSave, shift }) => {
    const isEditing = Boolean(shift);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (isEditing) {
            setFormData(shift);
        } else {
            setFormData({ shift_name: '', start_time: null, end_time: null, duration_hours: 9, paid_break_minutes: 30, shift_type: 'Fixed' });
        }
    }, [shift, open]);

    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEditing ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}><TextField name="shift_name" label="Shift Name" value={formData.shift_name || ''} onChange={handleChange} fullWidth required /></Grid>
                    <Grid item xs={12}><FormControl fullWidth><InputLabel>Shift Type</InputLabel><Select name="shift_type" label="Shift Type" value={formData.shift_type || 'Fixed'} onChange={handleChange}><MenuItem value="Fixed">Fixed</MenuItem><MenuItem value="Flexible">Flexible</MenuItem></Select></FormControl></Grid>
                    {formData.shift_type === 'Fixed' ? (
                        <>
                            <Grid item xs={6}><TextField name="start_time" label="Start Time" type="time" value={formData.start_time || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                            <Grid item xs={6}><TextField name="end_time" label="End Time" type="time" value={formData.end_time || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                        </>
                    ) : (
                        <Grid item xs={12}><TextField name="duration_hours" label="Required Duration (Hours)" type="number" value={formData.duration_hours || ''} onChange={handleChange} fullWidth /></Grid>
                    )}
                    <Grid item xs={12}><TextField name="paid_break_minutes" label="Paid Break (Minutes)" type="number" value={formData.paid_break_minutes || ''} onChange={handleChange} fullWidth /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={() => onSave(formData)} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};
export default ShiftForm;