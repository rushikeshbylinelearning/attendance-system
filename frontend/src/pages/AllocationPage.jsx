import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import {
  Alert, Pagination, Stack, Dialog, DialogActions, DialogContent,
  DialogTitle, Button, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar,
  Box, Divider, Chip
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import "../styles/AllocationPage.css";

// List of fields for creating the initial empty state for the form
const formColumns = [
    { id: 'Seat No', label: 'Seat No' },
    { id: 'Monitor make', label: 'Monitor Make' }, { id: 'Monitor Serial No', label: 'Monitor S/N' },
    { id: 'Keyboard make', label: 'Keyboard Make' }, { id: 'KB Serial No', label: 'Keyboard S/N' },
    { id: 'Mouse make', label: 'Mouse Make' }, { id: 'Mouse Serial No', label: 'Mouse S/N' },
    { id: 'UPS make', label: 'UPS Make' }, { id: 'UPS Serial No', label: 'UPS S/N' },
    { id: 'CPU Box', label: 'CPU Box' }, { id: 'CPU Serial No', label: 'CPU Serial No' },
    { id: 'Processor', label: 'Processor' }, { id: 'GPU', label: 'GPU' },
    { id: 'RAM', label: 'RAM' }, { id: 'HDD', label: 'HDD' },
    { id: 'Pen Tab', label: 'Pen Tab' }, { id: 'Serial No', label: 'Serial No' },
    { id: 'Headphone', label: 'Headphone' }, { id: 'Headphone S/N', label: 'Headphone S/N' },
    { id: 'Laptop make', label: 'Laptop Make' }, { id: 'Laptop Serial No', label: 'Laptop S/N' },
    { id: 'Remark', label: 'Remark' },
];

// FIX 1: Initialize state with the keys your backend requires: 'user' and 'employeeName'
const initialFormState = formColumns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {
  user: '',
  employeeName: '',
  Role: ''
});

// FIX 2: Update the table display to use the correct 'employeeName' key from your schema
const simplifiedDisplayConfig = [
    { id: 'srNo', label: 'Sr. No.' },
    { id: 'employeeName', label: 'Employee Name' },
    { id: 'Role', label: 'Role' },
    { label: 'Laptop', makeField: 'Laptop make', snField: 'Laptop Serial No' },
    { label: 'Monitor', makeField: 'Monitor make', snField: 'Monitor Serial No' },
    { label: 'CPU', makeField: 'CPU Box', snField: 'CPU Serial No' },
    { label: 'Keyboard', makeField: 'Keyboard make', snField: 'KB Serial No' },
    { label: 'Mouse', makeField: 'Mouse make', snField: 'Mouse Serial No' },
    { label: 'UPS', makeField: 'UPS make', snField: 'UPS Serial No' },
    { label: 'Pen Tab', makeField: 'Pen Tab', snField: 'Serial No' },
    { label: 'Headphone', makeField: 'Headphone', snField: 'Headphone S/N' },
];

// Configuration for the dialog form dropdowns
const componentFormConfig = [
    { name: 'Laptop', inventoryType: 'Laptop', fieldsToUpdate: { brand: 'Laptop make', serialNumber: 'Laptop Serial No' } },
    { name: 'Monitor', inventoryType: 'Monitor', fieldsToUpdate: { brand: 'Monitor make', serialNumber: 'Monitor Serial No' } },
    { name: 'CPU', inventoryType: 'CPU', fieldsToUpdate: { brand: 'CPU Box', serialNumber: 'CPU Serial No', 'specifications.processor': 'Processor', 'specifications.graphicCard': 'GPU', 'specifications.ram': 'RAM', 'specifications.storage': 'HDD' } },
    { name: 'Keyboard', inventoryType: 'Keyboard', fieldsToUpdate: { brand: 'Keyboard make', serialNumber: 'KB Serial No' } },
    { name: 'Mouse', inventoryType: 'Mouse', fieldsToUpdate: { brand: 'Mouse make', serialNumber: 'Mouse Serial No' } },
    { name: 'UPS', inventoryType: 'UPS', fieldsToUpdate: { brand: 'UPS make', serialNumber: 'UPS Serial No' } },
    { name: 'Pen Tab', inventoryType: 'Pen Tab', fieldsToUpdate: { brand: 'Pen Tab', serialNumber: 'Serial No' } },
    { name: 'Headphone', inventoryType: 'Headphone', fieldsToUpdate: { brand: 'Headphone', serialNumber: 'Headphone S/N' } }
];

function AllocationPage() {
    const [allRecords, setAllRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [users, setUsers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentAllocationData, setCurrentAllocationData] = useState(initialFormState);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [allocationsRes, usersRes, inventoryRes] = await Promise.all([
                    api.get('/allocations'),
                    api.get('/users'),
                    api.get('/inventory')
                ]);
                setAllRecords(allocationsRes.data);
                setFilteredRecords(allocationsRes.data);
                setUsers(usersRes.data);
                setInventory(inventoryRes.data);
                setError('');
            } catch (err) {
                console.error('Failed to fetch initial data:', err);
                setError('Could not load page data. Please check the console and try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const results = allRecords.filter((record) =>
            Object.values(record).some(value =>
                String(value).toLowerCase().includes(lowercasedTerm)
            )
        );
        setFilteredRecords(results);
        setCurrentPage(1);
    }, [searchTerm, allRecords]);

    const indexOfLast = currentPage * recordsPerPage;
    const indexOfFirst = indexOfLast - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);

    const handleOpenAddDialog = () => {
        setIsEditMode(false);
        setCurrentAllocationData(initialFormState);
        setDialogOpen(true);
    };

    const handleOpenEditDialog = (record) => {
        setIsEditMode(true);
        // FIX 3: Ensure 'user' is handled correctly (it might be an object from the API)
        const userData = record.user && typeof record.user === 'object' ? record.user._id : record.user;
        setCurrentAllocationData({ ...initialFormState, ...record, user: userData });
        setDialogOpen(true);
    };

    const handleOpenDeleteConfirm = (record) => {
        setRecordToDelete(record);
        setDeleteConfirmOpen(true);
    };

    // FIX 4: The form handler now correctly sets 'user' ID and 'employeeName'
    const handleFormChange = (event) => {
        const { name, value } = event.target;
        // This 'name' will be 'user' from the Select component
        if (name === 'user') {
            const selectedUser = users.find(u => u._id === value);
            setCurrentAllocationData({
                ...currentAllocationData,
                user: selectedUser?._id || '',
                employeeName: selectedUser?.name || '',
                Role: selectedUser?.role || ''
            });
        } else {
            setCurrentAllocationData({ ...currentAllocationData, [name]: value });
        }
    };

    const getNestedValue = (obj, path) => path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : '', obj);

    const handleComponentChange = (inventoryItemId, componentConfig) => {
        const selectedItem = inventory.find(item => item._id === inventoryItemId);
        let updatedFields = {};
        for (const formKey of Object.values(componentConfig.fieldsToUpdate)) {
            updatedFields[formKey] = '';
        }
        if (selectedItem) {
            for (const [inventoryKey, formKey] of Object.entries(componentConfig.fieldsToUpdate)) {
                updatedFields[formKey] = getNestedValue(selectedItem, inventoryKey);
            }
        }
        setCurrentAllocationData(prevData => ({ ...prevData, ...updatedFields }));
    };

    const handleSaveAllocation = async () => {
        // FIX 5: Validate that a user has been selected before sending
        if (!currentAllocationData.user || !currentAllocationData.employeeName) {
            setSnackbar({ open: true, message: 'Error: An employee must be selected.', severity: 'error' });
            return;
        }

        setLoading(true);
        try {
            // The payload is now correctly structured because the state is correct
            const payload = { ...currentAllocationData };

            if (!isEditMode) {
                delete payload._id;
            }

            const response = isEditMode
                ? await api.put(`/allocations/${payload._id}`, payload)
                : await api.post('/allocations', payload);

            if (isEditMode) {
                setAllRecords(allRecords.map(r => r._id === response.data._id ? response.data : r));
            } else {
                setAllRecords([...allRecords, response.data]);
            }

            const invRes = await api.get('/inventory');
            setInventory(invRes.data);

            setSnackbar({ open: true, message: `Allocation ${isEditMode ? 'updated' : 'added'} successfully!`, severity: 'success' });
            setDialogOpen(false);
        } catch (err) {
            console.error("Detailed error saving allocation:", err);
            let errorMessage = `Failed to ${isEditMode ? 'update' : 'add'} allocation.`;
            if (err.response) {
                const serverMessage = err.response.data?.message || err.response.data?.error || `Server responded with status ${err.response.status}`;
                errorMessage = `Error: ${serverMessage}`;
            } else if (err.request) {
                errorMessage = "Could not connect to the server. Please check the network.";
            }
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAllocation = async () => {
        if (!recordToDelete) return;
        setLoading(true);
        try {
            await api.delete(`/allocations/${recordToDelete._id}`);
            setAllRecords(allRecords.filter(r => r._id !== recordToDelete._id));
            const invRes = await api.get('/inventory');
            setInventory(invRes.data);
            setSnackbar({ open: true, message: 'Allocation deleted!', severity: 'warning' });
        } catch (err) {
            console.error("Detailed error deleting allocation:", err);
            let errorMessage = 'Failed to delete allocation.';
             if (err.response) {
                const serverMessage = err.response.data?.message || err.response.data?.error || `Server responded with status ${err.response.status}`;
                errorMessage = `Error: ${serverMessage}`;
            } else if (err.request) {
                errorMessage = "Could not connect to the server. Please check the network.";
            }
            setSnackbar({ open: true, message: errorMessage, severity: 'error' });
        } finally {
            setDeleteConfirmOpen(false);
            setRecordToDelete(null);
            setLoading(false);
        }
    };

    const getComponentDisplayValue = (record, col) => {
        const make = record[col.makeField];
        const sn = record[col.snField];
        return make ? `${make} (${sn || 'No S/N'})` : 'N/A';
    }

    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

    return (
        <>
            <div className="allocation-page-container">
                <div className="allocation-content-wrapper">
                    <header className="allocation-list-header">
                        <h1 className="allocation-list-title">Asset Allocations</h1>
                        <button className="new-allocation-btn" onClick={handleOpenAddDialog}>
                            <AddIcon /> New Allocation
                        </button>
                    </header>
                    <div className="allocation-filters-container">
                        <div className="filter-input-group">
                            <SearchIcon className="filter-icon" />
                            <input type="text" className="filter-input has-icon" placeholder="Search allocations..."
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    {loading && !dialogOpen ? (
                        <div className="allocation-page-feedback-wrapper">
                            <div className="allocation-page-loading"><div className="allocation-page-spinner"></div><p>Loading...</p></div>
                        </div>
                    ) : (
                        <>
                            <div className="allocation-table-container">
                                <table className="allocation-list-table">
                                    <thead>
                                        <tr>
                                            {simplifiedDisplayConfig.map((col) => (<th key={col.label}>{col.label}</th>))}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRecords.map((record, index) => (
                                            <tr key={record._id} onClick={() => handleOpenEditDialog(record)} className="clickable-row">
                                                {simplifiedDisplayConfig.map((col) => (
                                                    <td key={`${record._id}-${col.label}`} data-label={col.label}>
                                                        {col.id === 'srNo' ? indexOfFirst + index + 1 :
                                                            col.id ? record[col.id] || 'N/A' :
                                                                getComponentDisplayValue(record, col)}
                                                    </td>
                                                ))}
                                                <td data-label="Actions" className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                    <button className="action-btn edit" onClick={() => handleOpenEditDialog(record)} title="Edit Allocation"><EditIcon fontSize="small" /></button>
                                                    <button className="action-btn delete" onClick={(e) => { e.stopPropagation(); handleOpenDeleteConfirm(record); }} title="Delete Allocation"><DeleteIcon fontSize="small" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Stack alignItems="center" sx={{ padding: 'var(--spacing-6)' }}>
                                <Pagination count={Math.ceil(filteredRecords.length / recordsPerPage)}
                                    page={currentPage} onChange={(e, value) => setCurrentPage(value)}
                                    color="primary" shape="rounded" />
                            </Stack>
                        </>
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
                <DialogTitle>{isEditMode ? 'Update Allocation' : 'Add New Allocation'}</DialogTitle>
                <DialogContent>
                    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2.5} sx={{ mt: 1 }}>
                        <FormControl fullWidth variant="outlined" sx={{ gridColumn: '1 / -1' }}>
                            <InputLabel>Employee Name</InputLabel>
                            {/* FIX 6: The Select component now works with the User ID */}
                            <Select
                                name="user"
                                value={currentAllocationData.user || ''}
                                label="Employee Name"
                                onChange={handleFormChange}
                            >
                                {users.map(user => (
                                    <MenuItem key={user._id} value={user._id}>
                                        {user.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField name="Role" label="Role" value={currentAllocationData.Role || ''} variant="outlined" disabled />
                        <TextField name="Seat No" label="Seat No" value={currentAllocationData['Seat No'] || ''} onChange={handleFormChange} variant="outlined" />

                        <Divider sx={{ gridColumn: '1 / -1', my: 1 }}><Chip label="Assigned Components" /></Divider>

                        {componentFormConfig.map((comp) => {
                            const assignedSNField = comp.fieldsToUpdate.serialNumber;
                            const currentAssignedSN = currentAllocationData[assignedSNField];
                            const availableItems = inventory.filter(item =>
                                item.componentType === comp.inventoryType && 
                                (item.status === 'In Stock' || item.status === 'Unassigned')
                            );
                            const currentlyAssignedItem = currentAssignedSN
                                ? inventory.find(item => item.serialNumber === currentAssignedSN)
                                : null;
                            let dropdownOptions = [...availableItems];
                            if (currentlyAssignedItem && !dropdownOptions.some(item => item._id === currentlyAssignedItem._id)) {
                                dropdownOptions.unshift(currentlyAssignedItem);
                            }
                            const selectedValue = currentlyAssignedItem ? currentlyAssignedItem._id : '';
                            return (
                                <FormControl key={comp.name} fullWidth variant="outlined">
                                    <InputLabel>{comp.name}</InputLabel>
                                    <Select
                                        value={selectedValue}
                                        label={comp.name}
                                        onChange={(e) => handleComponentChange(e.target.value, comp)}
                                    >
                                        <MenuItem value=""><em>None / Unassign</em></MenuItem>
                                        {dropdownOptions.map(item => (
                                            <MenuItem key={item._id} value={item._id}>
                                                {`${item.brand} - ${item.serialNumber}`}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            );
                        })}

                        <TextField name="Remark" label="Remark" value={currentAllocationData['Remark'] || ''} onChange={handleFormChange} variant="outlined" multiline rows={3} sx={{ gridColumn: '1 / -1' }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveAllocation} variant="contained" disabled={loading}>{isEditMode ? 'Save Changes' : 'Save Allocation'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                {/* FIX 7: Use the correct 'employeeName' key for the delete confirmation */}
                <DialogContent><p>Are you sure you want to delete the allocation for "{recordToDelete?.employeeName}"? This will return all their assets to the inventory.</p></DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteAllocation} color="error" variant="contained" disabled={loading}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

export default AllocationPage;