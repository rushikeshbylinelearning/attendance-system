import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Snackbar, Alert, IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import '../styles/InventoryPage.css';

const ManageComponentTypes = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentType, setCurrentType] = useState({ name: '', description: '' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/component-types');
            setTypes(response.data);
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to fetch component types.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const handleOpenDialog = (type = null) => {
        setIsEditMode(!!type);
        setCurrentType(type ? { ...type } : { name: '', description: '' });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setCurrentType({ name: '', description: '' });
    };

    const handleSave = async () => {
        if (!currentType.name.trim()) {
            setSnackbar({ open: true, message: 'Component name is required.', severity: 'warning' });
            return;
        }

        try {
            if (isEditMode) {
                await api.put(`/component-types/${currentType._id}`, currentType);
                setSnackbar({ open: true, message: 'Component type updated successfully!', severity: 'success' });
            } else {
                await api.post('/component-types', currentType);
                setSnackbar({ open: true, message: 'Component type added successfully!', severity: 'success' });
            }
            fetchTypes();
            handleCloseDialog();
        } catch (err) {
            setSnackbar({
                open: true,
                message: `Error: ${err.response?.data?.msg || 'Operation failed.'}`,
                severity: 'error',
            });
        }
    };

    const handleDelete = async (type) => {
        if (window.confirm(`Are you sure you want to delete '${type.name}'? This action cannot be undone.`)) {
            try {
                await api.delete(`/component-types/${type._id}`);
                setSnackbar({ open: true, message: 'Component type deleted.', severity: 'info' });
                fetchTypes();
            } catch (err) {
                setSnackbar({
                    open: true,
                    message: `Error: ${err.response?.data?.msg || 'Could not delete component type.'}`,
                    severity: 'error',
                });
            }
        }
    };

    return (
        <PageLayout>
            <div className="inventory-page-container">
                <div className="inventory-content-wrapper">
                    <header className="inventory-list-header">
                        <h1 className="inventory-list-title">Manage Component Types</h1>
                        <button className="add-item-btn" onClick={() => handleOpenDialog()}>
                            <AddIcon /> Add Type
                        </button>
                    </header>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Component Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {types.map((type) => (
                                        <TableRow key={type._id}>
                                            <TableCell>{type.name}</TableCell>
                                            <TableCell>{type.description || 'N/A'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleOpenDialog(type)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDelete(type)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>{isEditMode ? 'Edit Component Type' : 'Add New Component Type'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Component Name"
                        fullWidth
                        variant="standard"
                        value={currentType.name}
                        onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Description (Optional)"
                        fullWidth
                        variant="standard"
                        value={currentType.description}
                        onChange={(e) => setCurrentType({ ...currentType, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {isEditMode ? 'Save Changes' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageLayout>
    );
};

export default ManageComponentTypes;
