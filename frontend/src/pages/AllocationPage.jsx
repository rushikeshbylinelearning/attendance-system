import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import {
  Alert, Pagination, Stack, Dialog, DialogActions, DialogContent,
  DialogTitle, Button, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar,
  Box, Divider, Chip, CircularProgress
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import "../styles/AllocationPage.css";


// --- Mappings and Configs (No Changes Needed Here) ---
const fieldMapping = {
  'Seat No': 'seatNo',
  'Monitor make': 'monitorMake',
  'Monitor Serial No': 'monitorSerialNo',
  'Keyboard make': 'keyboardMake',
  'KB Serial No': 'kbSerialNo',
  'Mouse make': 'mouseMake',
  'Mouse Serial No': 'mouseSerialNo',
  'UPS make': 'upsMake',
  'UPS Serial No': 'upsSerialNo',
  'CPU Box': 'cpuBox',
  'CPU Serial No': 'cpuSerialNo',
  'Processor': 'processor',
  'GPU': 'gpu',
  'RAM': 'ram',
  'HDD': 'hdd',
  'Pen Tab make': 'penTabMake',
  'Pen Tab S/N': 'penTabSn',
  'Headphone make': 'headphoneMake',
  'Headphone S/N': 'headphoneSn',
  'Laptop make': 'laptopMake',
  'Laptop Serial No': 'laptopSerialNo',
  'Remark': 'remark',
  'Role': 'role',
  'Employee Name': 'employeeName'
};
const reverseFieldMapping = Object.fromEntries(Object.entries(fieldMapping).map(([key, value]) => [value, key]));
const formColumns = Object.keys(fieldMapping).map(key => ({ id: key, label: key }));
const initialFormState = formColumns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {});
const simplifiedDisplayConfig = [
    { id: 'srNo', label: 'Sr. No.' }, { id: 'employeeName', label: 'Employee Name' }, { id: 'role', label: 'Role' },
    { label: 'Laptop', makeField: 'laptopMake', snField: 'laptopSerialNo' }, { label: 'Monitor', makeField: 'monitorMake', snField: 'monitorSerialNo' },
    { label: 'CPU', makeField: 'cpuBox', snField: 'cpuSerialNo' }, { label: 'Keyboard', makeField: 'keyboardMake', snField: 'kbSerialNo' },
    { label: 'Mouse', makeField: 'mouseMake', snField: 'mouseSerialNo' }, { label: 'UPS', makeField: 'upsMake', snField: 'upsSerialNo' },
    { label: 'Pen Tab', makeField: 'penTabMake', snField: 'penTabSn' }, { label: 'Headphone', makeField: 'headphoneMake', snField: 'headphoneSn' },
];

const componentFormConfig = [
    { name: 'Laptop', inventoryType: 'Laptop', fieldsToUpdate: { brand: 'Laptop make', serialNumber: 'Laptop Serial No' } },
    { name: 'Monitor', inventoryType: 'Monitor', fieldsToUpdate: { brand: 'Monitor make', serialNumber: 'Monitor Serial No' } },
    { name: 'CPU', inventoryType: 'CPU', fieldsToUpdate: { brand: 'CPU Box', serialNumber: 'CPU Serial No', 'specifications.processor': 'Processor', 'specifications.graphicCard': 'GPU', 'specifications.ram': 'RAM', 'specifications.storage': 'HDD' } },
    { name: 'Keyboard', inventoryType: 'Keyboard', fieldsToUpdate: { brand: 'Keyboard make', serialNumber: 'KB Serial No' } },
    { name: 'Mouse', inventoryType: 'Mouse', fieldsToUpdate: { brand: 'Mouse make', serialNumber: 'Mouse Serial No' } },
    { name: 'UPS', inventoryType: 'UPS', fieldsToUpdate: { brand: 'UPS make', serialNumber: 'UPS Serial No' } },
    { name: 'Pen Tab', inventoryType: 'Pen Tab', fieldsToUpdate: { brand: 'Pen Tab make', serialNumber: 'Pen Tab S/N' } },
    { name: 'Headphone', inventoryType: 'Headphone', fieldsToUpdate: { brand: 'Headphone make', serialNumber: 'Headphone S/N' } }
];

const toApiPayload = (formData) => {
  const payload = {};
  for (const [key, value] of Object.entries(formData)) {
    const apiKey = fieldMapping[key];
    if (apiKey) { payload[apiKey] = value; } else { payload[key] = value; }
  }
  return payload;
};
const fromApiRecord = (record) => {
  const formData = {};
  for (const [key, value] of Object.entries(record)) {
    const formKey = reverseFieldMapping[key];
    if (formKey) { formData[formKey] = value; } else { formData[key] = value; }
  }
  return formData;
};

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
    const [isDialogLoading, setIsDialogLoading] = useState(false);
    
    // --- FIX: State to hold the original data when the dialog opens ---
    const [initialDialogData, setInitialDialogData] = useState(null);

    // This useMemo is no longer needed for the dropdown logic but is good for other checks.
    const allocatedSerialNumbers = useMemo(() => {
        const snSet = new Set();
        const currentId = isEditMode ? currentAllocationData._id : null;
        allRecords.forEach(record => {
            if (record._id === currentId) return; 
            componentFormConfig.forEach(config => {
                const snApiField = fieldMapping[config.fieldsToUpdate.serialNumber];
                if (record[snApiField]) {
                    snSet.add(record[snApiField]);
                }
            });
        });
        return snSet;
    }, [allRecords, isEditMode, currentAllocationData._id]);

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
            Object.values(record).some(value => String(value).toLowerCase().includes(lowercasedTerm))
        );
        setFilteredRecords(results);
        setCurrentPage(1);
    }, [searchTerm, allRecords]);

    const handleOpenAllocationDialog = async (record = null) => {
        setIsDialogLoading(true);
        setDialogOpen(true);
        try {
            const inventoryRes = await api.get('/inventory');
            setInventory(inventoryRes.data);

            if (record) {
                setIsEditMode(true);
                const formData = fromApiRecord(record);
                // --- FIX: Set both current and initial state ---
                setCurrentAllocationData({ ...initialFormState, ...formData });
                setInitialDialogData({ ...initialFormState, ...formData });
            } else {
                setIsEditMode(false);
                // --- FIX: Set both current and initial state ---
                setCurrentAllocationData(initialFormState);
                setInitialDialogData(initialFormState);
            }
        } catch (err) {
            console.error("Failed to fetch latest inventory for dialog:", err);
            setSnackbar({ open: true, message: 'Could not load latest inventory data.', severity: 'error' });
            setDialogOpen(false);
        } finally {
            setIsDialogLoading(false);
        }
    };

    const handleOpenAddDialog = () => handleOpenAllocationDialog(null);
    const handleOpenEditDialog = (record) => handleOpenAllocationDialog(record);
    const handleOpenDeleteConfirm = (record) => { setRecordToDelete(record); setDeleteConfirmOpen(true); };

    const handleFormChange = (event) => {
        const { name, value } = event.target;
        if (name === 'Employee Name') {
            const selectedUser = users.find(u => u.name === value);
            setCurrentAllocationData({ ...currentAllocationData, 'Employee Name': selectedUser?.name || '', 'Role': selectedUser?.role || '' });
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
        setLoading(true);
        try {
            const selectedUser = users.find(u => u.name === currentAllocationData['Employee Name']);
            if (!selectedUser) {
                setSnackbar({ open: true, message: 'Invalid or no user selected.', severity: 'error' });
                setLoading(false);
                return;
            }
            
            let payload = toApiPayload(currentAllocationData);
            
            payload.user = selectedUser._id;
            payload.employeeId = selectedUser.employeeId; 

            if (!isEditMode) {
                delete payload._id;
            }

            isEditMode
                ? await api.put(`/allocations/${payload._id}`, payload)
                : await api.post('/allocations', payload);
            
            const allocationsRes = await api.get('/allocations');
            const inventoryRes = await api.get('/inventory');
            setAllRecords(allocationsRes.data);
            setInventory(inventoryRes.data);

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

            const allocationsRes = await api.get('/allocations');
            const inventoryRes = await api.get('/inventory');
            setAllRecords(allocationsRes.data);
            setInventory(inventoryRes.data);

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
    
    const indexOfLast = currentPage * recordsPerPage;
    const indexOfFirst = indexOfLast - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirst, indexOfLast);

    if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

    return (
        <>
            <div className="allocation-page-container">
                <div className="allocation-content-wrapper">
                    {/* ... rest of the JSX is unchanged ... */}
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
                                                    <button className="action-btn edit" onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(record);}} title="Edit Allocation"><EditIcon fontSize="small" /></button>
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
                    {isDialogLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: 400 }}><CircularProgress /></Box>
                    ) : (
                        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2.5} sx={{ mt: 1 }}>
                            <FormControl fullWidth variant="outlined" sx={{ gridColumn: '1 / -1' }}>
                                <InputLabel>Employee Name</InputLabel>
                                <Select name="Employee Name" value={currentAllocationData['Employee Name'] || ''} label="Employee Name" onChange={handleFormChange}>
                                    {users.map(user => <MenuItem key={user._id} value={user.name}>{user.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField name="Role" label="Role" value={currentAllocationData['Role'] || ''} variant="outlined" disabled />
                            <TextField name="Seat No" label="Seat No" value={currentAllocationData['Seat No'] || ''} onChange={handleFormChange} variant="outlined" />
                            <Divider sx={{ gridColumn: '1 / -1', my: 1 }}><Chip label="Assigned Components" /></Divider>
                            
                            {componentFormConfig.map((comp) => {
                                const assignedSNField = comp.fieldsToUpdate.serialNumber;
                                const currentAssignedSN = currentAllocationData[assignedSNField];

                                // --- FIX: Use initialDialogData to get the originally assigned item ---
                                const originalSN = initialDialogData ? initialDialogData[assignedSNField] : null;
                                
                                const dropdownOptions = inventory.filter(item => {
                                    if (item.componentType !== comp.inventoryType) {
                                        return false;
                                    }
                                    const wasOriginallyAssigned = originalSN && item.serialNumber === originalSN;
                                    
                                    // An item is a valid option if it's 'Unassigned' OR if it was the one
                                    // originally assigned when the dialog opened.
                                    return item.status === 'Unassigned' || wasOriginallyAssigned;
                                });
                                
                                const currentlyAssignedItem = currentAssignedSN ? inventory.find(item => item.serialNumber === currentAssignedSN) : null;
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
                                                    {`${item.brand} - ${item.serialNumber || 'N/A'}`}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                );
                            })}
                            
                            <TextField name="Remark" label="Remark" value={currentAllocationData['Remark'] || ''} onChange={handleFormChange} variant="outlined" multiline rows={3} sx={{ gridColumn: '1 / -1' }} />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveAllocation} variant="contained" disabled={loading || isDialogLoading}>{isEditMode ? 'Save Changes' : 'Save Allocation'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
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