import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import '../styles/InventoryPage.css';
import WarrantyStatus from '@/components/WarrantyStatus';

import {
  Alert, Pagination, Stack, Link, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Checkbox, FormControlLabel
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const allFormFields = [
  // CHANGE 1: Changed 'type' to 'select_component' and removed the hardcoded 'options' array.
  { id: 'componentType', label: 'Component Type', required: true, type: 'select_component' },
  { id: 'brand', label: 'Brand', required: true },
  { id: 'model', label: 'Model' },
  { id: 'serialNumber', label: 'Serial Number' },
  // The rest of the statuses are internal to the system, so we can keep this static
  { id: 'status', label: 'Status', type: 'select', options: ['Unassigned', 'Assigned', 'In-Repair', 'Retired'] },
  { id: 'assignedTo', label: 'Assigned To', type: 'select_user' },
  { id: 'processor', label: 'Processor', group: 'cpu' },
  { id: 'ram', label: 'RAM', group: 'cpu' },
  { id: 'storage', label: 'Storage', group: 'cpu' },
  { id: 'graphicCard', label: 'Graphic Card', group: 'cpu' },
  { id: 'purchaseDate', label: 'Purchase Date', type: 'date' },
  { id: 'warrantyYears', label: 'Warranty (Years)', type: 'number' },
  { id: 'isWarrantyRegistered', label: 'Warranty Registered', type: 'checkbox' },
  { id: 'invoiceLink', label: 'Invoice Link' },
];

const displayColumns = [
  { id: 'componentType', label: 'Component' },
  { id: 'brandAndModel', label: 'Brand & Model' },
  { id: 'serialNumber', label: 'Serial No.' },
  { id: 'processor', label: 'Processor' },
  { id: 'ram', label: 'RAM' },
  { id: 'graphicCard', label: 'Graphic Card' },
  { id: 'warranty', label: 'Warranty' },
  { id: 'invoiceLink', label: 'Invoice' },
  { id: 'status', label: 'Status' },
  { id: 'lastUpdated', label: 'Last Updated' },
];

const initialFormState = allFormFields.reduce((acc, col) => ({ ...acc, [col.id]: col.type === 'checkbox' ? false : '' }), {});

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  // CHANGE 2: Add new state to hold the dynamic component types from the API.
  const [componentTypes, setComponentTypes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItemData, setCurrentItemData] = useState(initialFormState);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // CHANGE 3: Fetch component types along with inventory and users.
        const [invRes, usersRes, typesRes] = await Promise.all([
          api.get('/inventory'), 
          api.get('/users'),
          api.get('/component-types')
        ]);
        setInventory(invRes.data);
        setUsers(usersRes.data);
        setComponentTypes(typesRes.data); // Set the new state
        setError('');
      } catch (err) { 
        setError('Could not load data. Ensure you are logged in and have the correct permissions.'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchInitialData();
  }, []);

  // ... (No other changes from here down to the Dialog rendering) ...
  const filteredInventory = inventory.filter(item =>
    Object.values(item).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase())) ||
    Object.values(item.specifications || {}).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const currentItems = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenDialog = (item = null) => {
    if (item) {
      const flattenedData = { ...item, ...(item.specifications || {}) };
      delete flattenedData.specifications;
      if (flattenedData.purchaseDate) flattenedData.purchaseDate = new Date(flattenedData.purchaseDate).toISOString().split('T')[0];
      setCurrentItemData(flattenedData);
      setIsEditMode(true);
    } else {
      setCurrentItemData(initialFormState);
      setIsEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newData = { ...currentItemData, [name]: type === 'checkbox' ? checked : value };

    if (name === 'status' && value !== 'Assigned') {
      newData.assignedTo = '';
    }

    if (name === 'assignedTo' && value) {
      newData.status = 'Assigned';
    }

    setCurrentItemData(newData);
  };

  const handleSaveItem = async () => {
    const { componentType, brand, model, serialNumber, status, assignedTo, purchaseDate, warrantyYears, isWarrantyRegistered, invoiceLink, ...specs } = currentItemData;
    let dataToSave = { componentType, brand, model, serialNumber, status, assignedTo, purchaseDate, warrantyYears, isWarrantyRegistered, invoiceLink, specifications: specs };
    if (assignedTo === '') dataToSave.assignedTo = null;
    if (purchaseDate && warrantyYears > 0) {
      const pDate = new Date(purchaseDate);
      pDate.setFullYear(pDate.getFullYear() + Number(warrantyYears));
      dataToSave.warrantyExpiry = pDate;
    }

    try {
      if (isEditMode) {
        const response = await api.put(`/inventory/${currentItemData._id}`, dataToSave);
        const populatedItem = await api.get(`/inventory/${currentItemData._id}`); // Re-fetch to get populated data
        setInventory(inventory.map(i => i._id === response.data._id ? populatedItem.data : i));
        setSnackbar({ open: true, message: 'Item updated successfully!', severity: 'success' });
      } else {
        const response = await api.post('/inventory', dataToSave);
        setInventory([...inventory, response.data]);
        setSnackbar({ open: true, message: 'Item added successfully!', severity: 'success' });
      }
      setDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.response?.data?.msg || 'Operation failed.'}`, severity: 'error' });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/inventory/${itemToDelete._id}`);
      setInventory(inventory.filter(i => i._id !== itemToDelete._id));
      setSnackbar({ open: true, message: 'Item deleted!', severity: 'warning' });
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.response?.data?.msg || 'Failed to delete item.'}`, severity: 'error' });
    }
    setDeleteConfirmOpen(false);
  };

  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;


  return (
    <>
      {/* ... (No changes to the main page layout or table) ... */}
      <div className="inventory-page-container">
        <div className="inventory-content-wrapper">
          <header className="inventory-list-header">
            <h1 className="inventory-list-title">Component Inventory</h1>
            <button className="add-item-btn" onClick={() => handleOpenDialog()}><AddIcon /> Add Item</button>
          </header>
          <div className="inventory-filters-container">
            <div className="filter-input-group">
              <SearchIcon className="filter-icon" />
              <input type="text" className="filter-input has-icon" placeholder="Search inventory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          {loading ? (<div className="inventory-page-feedback-wrapper"><div className="inventory-page-loading"><div className="inventory-page-spinner"></div><p className="inventory-page-loading-text">Loading...</p></div></div>) : (
            <>
              <div className="inventory-table-container">
                <table className="inventory-list-table">
                  <thead>
                    <tr>
                      <th>SR. NO.</th>
                      {displayColumns.map(c => <th key={c.id}>{c.label}</th>)}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, index) => (
                      <tr key={item._id}>
                        <td data-label="SR. NO.">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td data-label="Component">{item.componentType}</td>
                        <td data-label="Brand & Model">{`${item.brand} ${item.model || ''}`}</td>
                        <td data-label="Serial No.">{item.serialNumber || 'N/A'}</td>
                        <td data-label="Processor">{item.specifications?.processor || 'N/A'}</td>
                        <td data-label="RAM">{item.specifications?.ram || 'N/A'}</td>
                        <td data-label="Graphic Card">{item.specifications?.graphicCard || 'N/A'}</td>
                        <td data-label="Warranty"><WarrantyStatus expiryDate={item.warrantyExpiry} /></td>
                        <td data-label="Invoice">{item.invoiceLink ? <Link href={item.invoiceLink} target="_blank" rel="noopener">View</Link> : 'N/A'}</td>
                        <td data-label="Status"><span className={`status-chip ${String(item.status).toLowerCase().replace(/\s+/g, '-')}`}>{item.status}</span></td>
                        <td data-label="Last Updated">{new Date(item.updatedAt).toLocaleString()}</td>
                        <td data-label="Actions" className="actions-cell">
                          <button className="action-btn edit" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></button>
                          <button className="action-btn delete" onClick={() => { setItemToDelete(item); setDeleteConfirmOpen(true); }}><DeleteIcon fontSize="small" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Stack alignItems="center" sx={{ padding: 'var(--spacing-6)' }}>
                <Pagination count={Math.ceil(filteredInventory.length / itemsPerPage)} page={currentPage} onChange={(e, v) => setCurrentPage(v)} />
              </Stack>
            </>
          )}
        </div>
      </div>


      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{isEditMode ? 'Update Inventory Item' : 'Add New Item'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2, pt: '10px !important' }}>
          {allFormFields.map(field => {
            const isCpuField = field.group === 'cpu';
            if (isCpuField && !['CPU', 'Laptop'].includes(currentItemData.componentType)) return null;

            const isAssignedToDisabled = field.id === 'assignedTo' && currentItemData.status !== 'Assigned';

            // CHANGE 4: Add a new block to render our dynamic component dropdown.
            if (field.type === 'select_component') {
              return <FormControl key={field.id} fullWidth required={field.required}>
                <InputLabel>{field.label}</InputLabel>
                <Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}>
                    <MenuItem value="" disabled><em>Select a type...</em></MenuItem>
                    {componentTypes.map(type => <MenuItem key={type._id} value={type.name}>{type.name}</MenuItem>)}
                </Select>
              </FormControl>;
            }

            if (field.type === 'select') {
              return <FormControl key={field.id} fullWidth><InputLabel>{field.label}</InputLabel><Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}>
                {field.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select></FormControl>
            }
            if (field.type === 'select_user') {
              return <FormControl key={field.id} fullWidth disabled={isAssignedToDisabled}><InputLabel>{field.label}</InputLabel><Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}>
                <MenuItem value=""><em>None</em></MenuItem>
                {users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}
              </Select></FormControl>
            }
            if (field.type === 'checkbox') {
              return <FormControlLabel control={<Checkbox name={field.id} checked={!!currentItemData[field.id]} onChange={handleFormChange} />} label={field.label} sx={{ gridColumn: '1 / -1' }} />
            }
            return <TextField key={field.id} name={field.id} label={field.label} type={field.type || 'text'}
              value={currentItemData[field.id] || ''} onChange={handleFormChange} required={field.required}
              InputLabelProps={field.type === 'date' ? { shrink: true } : {}} />
          })}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} variant="contained">{isEditMode ? 'Save Changes' : 'Add Item'}</Button>
        </DialogActions>
      </Dialog>
      
      {/* ... (No changes to the other dialogs or snackbar) ... */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><p>Delete "{itemToDelete?.componentType} - {itemToDelete?.serialNumber}"?</p></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteItem} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </>
  );
}

export default InventoryPage;