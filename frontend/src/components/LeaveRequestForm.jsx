import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, CircularProgress, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import api from '../api/axios';

const LeaveRequestForm = ({ open, onClose, requestType, onSubmitted }) => {
    const [leaveDate, setLeaveDate] = useState(null);
    const [alternateDate, setAlternateDate] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!leaveDate || !reason) {
            setError('Please fill in all required fields.');
            return;
        }
        if (requestType === 'Swap' && !alternateDate) {
            setError('Alternate date is required for a swap request.');
            return;
        }

        setError('');
        setLoading(true);

        const payload = {
            requestType,
            leaveDates: [leaveDate],
            alternateDate: requestType === 'Swap' ? alternateDate : null,
            reason,
        };

        try {
            await api.post('/leaves/request', payload);
            onSubmitted(); // This will trigger a refresh on the parent page
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>New {requestType} Request</DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ pt: 2 }}>
                    {error && <Grid item xs={12}><Alert severity="error">{error}</Alert></Grid>}
                    <Grid item xs={12}>
                        <DatePicker
                            label={`Date of ${requestType}`}
                            value={leaveDate}
                            onChange={(newValue) => setLeaveDate(newValue)}
                            slotProps={{ textField: { fullWidth: true, required: true } }}
                        />
                    </Grid>
                    {requestType === 'Swap' && (
                        <Grid item xs={12}>
                            <DatePicker
                                label="Requested Alternate Work Date"
                                value={alternateDate}
                                onChange={(newValue) => setAlternateDate(newValue)}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                            />
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <TextField
                            label="Reason / Justification"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                            required
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Submit Request'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LeaveRequestForm;