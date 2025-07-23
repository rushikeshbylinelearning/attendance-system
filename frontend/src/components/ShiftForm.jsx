import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const ShiftForm = ({ open, onClose, onSave, shift }) => {
    const isEditing = Boolean(shift);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (isEditing) {
            setFormData(shift);
        } else {
            setFormData({ shiftName: '', startTime: '', endTime: '', durationHours: 8, paidBreakMinutes: 30, shiftType: 'Fixed' });
        }
    }, [shift, open]);

    const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ style: { borderRadius: 12 } }}>
            <DialogTitle>{isEditing ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}><TextField name="shiftName" label="Shift Name" value={formData.shiftName || ''} onChange={handleChange} fullWidth required /></Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel>Shift Type</InputLabel>
                            <Select name="shiftType" label="Shift Type" value={formData.shiftType || 'Fixed'} onChange={handleChange}>
                                <MenuItem value="Fixed">Fixed</MenuItem>
                                <MenuItem value="Flexible">Flexible</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    {formData.shiftType === 'Fixed' ? (
                        <>
                            <Grid item xs={6}><TextField name="startTime" label="Start Time" type="time" value={formData.startTime || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                            <Grid item xs={6}><TextField name="endTime" label="End Time" type="time" value={formData.endTime || ''} onChange={handleChange} InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                        </>
                    ) : (
                        <Grid item xs={12}><TextField name="durationHours" label="Required Duration (Hours)" type="number" value={formData.durationHours || ''} onChange={handleChange} fullWidth /></Grid>
                    )}
                    <Grid item xs={12}><TextField name="paidBreakMinutes" label="Paid Break (Minutes)" type="number" value={formData.paidBreakMinutes || ''} onChange={handleChange} fullWidth /></Grid>
                </Grid>
            </DialogContent>
            <DialogActions style={{ padding: '16px 24px', justifyContent: 'flex-end', gap: 12 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={() => onSave(formData)} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};
export default ShiftForm;