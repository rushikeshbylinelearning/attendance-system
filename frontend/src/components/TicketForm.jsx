import React, { useState, useEffect } from 'react';
import api from '@/services/api';

// Make sure all these are imported
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    TextField, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Select 
} from '@mui/material';

const TicketForm = ({ open, handleClose, ticket, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
    });

    // Get user info to check their role
    const user = JSON.parse(sessionStorage.getItem('user')); // Or localStorage
    const isAdminOrTech = user?.role === 'admin' || user?.role === 'technician';

    useEffect(() => {
        if (ticket) {
            // Populate form for editing an existing ticket
            setFormData({
                title: ticket.title || '',
                description: ticket.description || '',
                priority: ticket.priority || 'medium',
                status: ticket.status || 'open',
            });
        } else {
            // Reset form for creating a new ticket
            setFormData({ title: '', description: '', priority: 'medium', status: 'open' });
        }
    }, [ticket, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            if (ticket) {
                await api.put(`/tickets/${ticket._id}`, formData);
            } else {
                await api.post('/tickets', formData);
            }
            onSave();
            handleClose();
        } catch (error) {
            console.error('Failed to save ticket:', error);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{ticket ? 'View / Edit Ticket' : 'Create New Ticket'}</DialogTitle>
            <DialogContent>
                {/* All fields are disabled for an employee if they are viewing an existing ticket */}
                <TextField 
                    autoFocus 
                    margin="dense" 
                    name="title" 
                    label="Title" 
                    required 
                    fullWidth 
                    value={formData.title} 
                    onChange={handleChange} 
                    disabled={ticket && !isAdminOrTech}
                />
                <TextField 
                    margin="dense" 
                    name="description" 
                    label="Description" 
                    required 
                    fullWidth 
                    multiline 
                    rows={4} 
                    value={formData.description} 
                    onChange={handleChange}
                    disabled={ticket && !isAdminOrTech}
                />
                
                <FormControl fullWidth margin="dense" disabled={ticket && !isAdminOrTech}>
                    <InputLabel id="priority-select-label">Priority</InputLabel>
                    <Select
                        labelId="priority-select-label"
                        name="priority"
                        value={formData.priority}
                        label="Priority"
                        onChange={handleChange}
                    >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                    </Select>
                </FormControl>

                {/* THE FIX: Only show the Status field to Admins/Techs when editing a ticket */}
                {isAdminOrTech && ticket && (
                    <FormControl fullWidth margin="dense">
                        <InputLabel id="status-select-label">Status</InputLabel>
                        <Select
                            labelId="status-select-label"
                            name="status"
                            value={formData.status}
                            label="Status"
                            onChange={handleChange}
                        >
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="in-progress">In Progress</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                {/* The Save button is also disabled for employees viewing a ticket */}
                <Button onClick={handleSubmit} variant="contained" disabled={ticket && !isAdminOrTech}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TicketForm;