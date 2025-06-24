import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import api from '@/services/api';

const AssetForm = ({ open, handleClose, asset, onSave }) => {
    // Initialize the form data with default empty values
    const [formData, setFormData] = useState({
        assetName: '',
        assetType: '',
        serialNumber: '',
        status: 'in-stock',
    });
    
    // This effect runs when the modal opens.
    // If an 'asset' object is passed, it fills the form for editing.
    // Otherwise, it resets the form for adding a new asset.
    useEffect(() => {
        if (asset) {
            setFormData({
                assetName: asset.assetName || '',
                assetType: asset.assetType || '',
                serialNumber: asset.serialNumber || '',
                status: asset.status || 'in-stock',
            });
        } else {
            setFormData({ assetName: '', assetType: '', serialNumber: '', status: 'in-stock' });
        }
    }, [asset, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            if (asset && asset._id) {
                // If an asset exists, we are updating it
                await api.put(`/assets/${asset._id}`, formData);
            } else {
                // Otherwise, we are creating a new one
                await api.post('/assets', formData);
            }
            onSave(); // This calls the fetchAssets function in the parent page to refresh the list
            handleClose(); // This closes the modal
        } catch (error) {
            console.error('Failed to save asset:', error);
            // In a real app, you might show a user-facing error message here
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            <DialogContent>
                <TextField autoFocus margin="dense" name="assetName" label="Asset Name" type="text" fullWidth variant="outlined" value={formData.assetName} onChange={handleChange} required />
                <TextField margin="dense" name="assetType" label="Asset Type" type="text" fullWidth variant="outlined" value={formData.assetType} onChange={handleChange} required />
                <TextField margin="dense" name="serialNumber" label="Serial Number" type="text" fullWidth variant="outlined" value={formData.serialNumber} onChange={handleChange} required />
                <TextField margin="dense" name="status" label="Status" select fullWidth value={formData.status} onChange={handleChange}>
                    <MenuItem value="in-stock">In Stock</MenuItem>
                    <MenuItem value="in-use">In Use</MenuItem>
                    <MenuItem value="under-repair">Under Repair</MenuItem>
                    <MenuItem value="retired">Retired</MenuItem>
                </TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssetForm;