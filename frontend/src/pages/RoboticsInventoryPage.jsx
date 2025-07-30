// pages/RoboticsInventoryPage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '@/services/api';
import '../styles/RoboticsInventoryPage.css';

import {
  Alert, Pagination, Stack, Link, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Checkbox,
  Toolbar, Typography, Tooltip, IconButton, Box, CircularProgress, TableSortLabel,
  Menu, List, ListItem, ListItemText, Divider, ListItemIcon, 
  InputAdornment
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { alpha } from '@mui/material/styles';
import { 
    Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
    FileUpload as FileUploadIcon, FilterList as FilterListIcon
} from '@mui/icons-material';

// --- Component Configuration (No changes here) ---
const allFormFields = [
  { id: 'partName', label: 'Part Name', required: true },
  { id: 'sku', label: 'SKU / Part Number' },
  { id: 'manufacturer', label: 'Manufacturer' },
  { 
    id: 'partType', 
    label: 'Part Type', 
    required: true, 
    type: 'select', 
    options: [
        'Sensor', 'Motor', 'Controller', 'Microprocessor', 'Microcontroller', 'Motor Driver', 
        'Actuator', 'Actuator/Motor', 'Mechanical Part', 'Chassis', 'Battery', 'Misc'
    ] 
  },
  { id: 'quantity', label: 'Quantity', required: true, type: 'number' },
  { id: 'location', label: 'Storage Location' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'purchaseDate', label: 'Purchase Date', type: 'date' },
  { id: 'datasheetUrl', label: 'Datasheet URL' },
  { id: 'notes', label: 'Notes / Details', multiline: true, rows: 3 },
];

const displayColumns = [
  { id: 'partName', label: 'Part Name', sortKey: 'partName', filterKey: 'partName' },
  { id: 'partType', label: 'Type', sortKey: 'partType', filterKey: 'partType' },
  { id: 'quantity', label: 'Quantity', sortKey: 'quantity' },
  { id: 'notes', label: 'Details', sortKey: 'notes' },
  { id: 'location', label: 'Location', sortKey: 'location', filterKey: 'location' },
  { id: 'lastUpdated', label: 'Last Updated', sortKey: 'updatedAt' },
];

const initialFormState = allFormFields.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {});
const searchableKeys = ['partName', 'partType', 'notes', 'location', 'sku', 'manufacturer', 'supplier'];
const getNestedValue = (obj, path) => path.split('.').reduce((o, i) => (o ? o[i] : null), obj);

function RoboticsInventoryPage() {
  // --- All states are defined first ---
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItemData, setCurrentItemData] = useState(initialFormState);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const [filters, setFilters] = useState({});
  const [filterMenu, setFilterMenu] = useState({ anchorEl: null, columnId: null });
  const [tempFilterValues, setTempFilterValues] = useState([]);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');

  // ✅ CORRECTED ORDER: Data processing pipeline is defined immediately after states.
  const searchedInventory = useMemo(() => {
    return inventory.filter(item =>
        searchTerm === '' ? true : searchableKeys.some(key =>
            item[key] && String(item[key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
  }, [inventory, searchTerm]);

  const filteredInventory = useMemo(() => {
    const activeFilterKeys = Object.keys(filters).filter(key => filters[key]?.length > 0);
    if (activeFilterKeys.length === 0) return searchedInventory;
    return searchedInventory.filter(item => {
        return activeFilterKeys.every(key => {
            const itemValue = getNestedValue(item, key);
            return filters[key].includes(String(itemValue || 'N/A'));
        });
    });
  }, [searchedInventory, filters]);

  const sortedInventory = useMemo(() => {
    if (!sortConfig.key) return filteredInventory;
    return [...filteredInventory].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      const valA = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
      const valB = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInventory, sortConfig]);
  
  const currentItems = sortedInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- All useEffects are defined after data processing. ---
  const fetchInventory = async () => {
    try { setLoading(true); const res = await api.get('/robotics-inventory'); setInventory(res.data); setError(''); } catch (err) { setError('Could not load inventory data. Please try again later.'); } finally { setLoading(false); }
  };
  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault(); 
        if (isSelectionModeActive) {
          setSelectedItems([]);
          setIsSelectionModeActive(false);
        } else {
          setIsSelectionModeActive(true);
          // Now `sortedInventory` is guaranteed to be initialized
          setSelectedItems(sortedInventory.map(item => item._id));
        }
      }
      if (event.key === 'Escape') {
          setIsSelectionModeActive(false);
          setSelectedItems([]);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelectionModeActive, sortedInventory]);

  // --- All handler functions defined after effects ---
  const handleImportClick = () => fileInputRef.current.click();
  const handleFileChange = async (event) => { 
    const file = event.target.files[0]; if (!file) return; const formData = new FormData(); formData.append('file', file); setLoading(true); try { const res = await api.post('/robotics-inventory/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); setSnackbar({ open: true, message: res.data.msg, severity: 'success' }); await fetchInventory(); } catch (err) { setSnackbar({ open: true, message: `Import failed: ${err.response?.data?.msg || 'Please check file format.'}`, severity: 'error' }); } finally { setLoading(false); event.target.value = null; }
  };
  const handleSortRequest = (property) => { 
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc'; setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' });
  };
  const handleOpenDialog = (item = null) => { 
    if (item) { const formData = { ...item }; if (formData.purchaseDate) formData.purchaseDate = new Date(formData.purchaseDate).toISOString().split('T')[0]; setCurrentItemData(formData); setIsEditMode(true); } else { setCurrentItemData(initialFormState); setIsEditMode(false); } setDialogOpen(true);
  };
  const handleFormChange = (e) => { 
    const { name, value } = e.target; setCurrentItemData({ ...currentItemData, [name]: value });
  };
  const handleSaveItem = async () => { 
    try { if (isEditMode) { const response = await api.put(`/robotics-inventory/${currentItemData._id}`, currentItemData); setInventory(inventory.map(i => i._id === response.data._id ? response.data : i)); setSnackbar({ open: true, message: 'Item updated successfully!', severity: 'success' }); } else { const response = await api.post('/robotics-inventory', currentItemData); setInventory([...inventory, response.data]); setSnackbar({ open: true, message: 'Item added successfully!', severity: 'success' }); } setDialogOpen(false); } catch (err) { setSnackbar({ open: true, message: `Error: ${err.response?.data?.msg || 'Operation failed.'}`, severity: 'error' }); }
  };
  const handleDeleteItem = async () => { 
    if (!itemToDelete) return; try { await api.delete(`/robotics-inventory/${itemToDelete._id}`); setInventory(inventory.filter(i => i._id !== itemToDelete._id)); setSnackbar({ open: true, message: 'Item deleted!', severity: 'warning' }); } catch (err) { setSnackbar({ open: true, message: 'Failed to delete item.', severity: 'error' }); } setDeleteConfirmOpen(false); setItemToDelete(null);
  };
  const handleExecuteBulkDelete = async () => { 
    setLoading(true); try { await api.post('/robotics-inventory/bulk-delete', { ids: selectedItems }); setInventory(inventory.filter(item => !selectedItems.includes(item._id))); setSnackbar({ open: true, message: `${selectedItems.length} items deleted!`, severity: 'warning' }); } catch (err) { setSnackbar({ open: true, message: `Error: ${err.response?.data?.msg || 'Bulk delete failed.'}`, severity: 'error' }); } finally { setBulkDeleteConfirmOpen(false); setSelectedItems([]); setLoading(false); setIsSelectionModeActive(false); }
  };
  const handleSelectAllOnPage = (event) => {
    if (event.target.checked) {
      setSelectedItems(currentItems.map((item) => item._id));
    } else {
      setSelectedItems([]);
    }
  };
  const handleSelectOne = (event, id) => {
    if (!isSelectionModeActive) setIsSelectionModeActive(true);
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };
  const handleOpenFilterMenu = (event, column) => {
    setFilterMenu({ anchorEl: event.currentTarget, columnId: column.filterKey });
    setTempFilterValues(filters[column.filterKey] || []);
  };
  const handleCloseFilterMenu = () => {
    setFilterMenu({ anchorEl: null, columnId: null });
    setTempFilterValues([]);
    setFilterSearchTerm('');
  };
  const handleTempFilterChange = (value) => {
    setTempFilterValues(prev => 
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };
  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, [filterMenu.columnId]: tempFilterValues }));
    setCurrentPage(1);
    handleCloseFilterMenu();
  };
  const handleClearColumnFilter = () => {
    setFilters(prev => {
        const newFilters = {...prev};
        delete newFilters[filterMenu.columnId];
        return newFilters;
    });
    setCurrentPage(1);
    handleCloseFilterMenu();
  };
  const allFilterOptions = useMemo(() => {
    if (!filterMenu.columnId) return [];
    const values = searchedInventory.map(item => String(getNestedValue(item, filterMenu.columnId) || 'N/A'));
    return [...new Set(values)].sort();
  }, [filterMenu.columnId, searchedInventory]);
  const displayedFilterOptions = useMemo(() => {
    if (!filterSearchTerm) return allFilterOptions;
    return allFilterOptions.filter(opt => opt.toLowerCase().includes(filterSearchTerm.toLowerCase()));
  }, [allFilterOptions, filterSearchTerm]);

  const renderCellContent = (item, columnId) => { 
    switch(columnId) { case 'datasheetUrl': return item.datasheetUrl ? <Link href={item.datasheetUrl} target="_blank" rel="noopener">View</Link> : 'N/A'; case 'lastUpdated': return new Date(item.updatedAt).toLocaleString(); default: return item[columnId] || 'N/A'; }
  };

  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

  // --- JSX / Render ---
  return (
    <div className="robotics-inventory-page-container">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" />
        <div className="robotics-inventory-content-wrapper">
            <header className="robotics-inventory-list-header">
                <h1 className="robotics-inventory-list-title">Robotics Inventory</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="import-btn" onClick={handleImportClick}><FileUploadIcon /> Import from Excel</button>
                    <button className="add-item-btn" onClick={() => handleOpenDialog()}><AddIcon /> Add Item</button>
                </div>
            </header>

            {(isSelectionModeActive && selectedItems.length > 0) ? (
                <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, mb: 2, borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15) }}>
                    <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">{selectedItems.length} selected</Typography>
                    <Tooltip title="Delete Selected"><IconButton onClick={() => setBulkDeleteConfirmOpen(true)}><DeleteIcon /></IconButton></Tooltip>
                </Toolbar>
            ) : (
                <div className="robotics-inventory-filters-container">
                    <div className="filter-input-group">
                        <SearchIcon className="filter-icon" />
                        <input type="text" className="filter-input has-icon" placeholder="Search inventory... (Press Ctrl+A to select all)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            )}
            
            {loading ? (<Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}><CircularProgress /></Box>) : (
            <>
                <div className="robotics-inventory-table-container">
                <table className="robotics-inventory-list-table">
                    <thead>
                    <tr>
                        {isSelectionModeActive ? (
                            <th>
                                <Checkbox color="primary" indeterminate={selectedItems.length > 0 && selectedItems.length < currentItems.length} checked={currentItems.length > 0 && selectedItems.length === currentItems.length} onChange={handleSelectAllOnPage} />
                            </th>
                        ) : (
                            <th>SR. NO.</th>
                        )}
                        
                        {displayColumns.map(column => (
                        <th key={column.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                                {column.sortKey ? (
                                    <TableSortLabel active={sortConfig.key === column.sortKey} direction={sortConfig.key === column.sortKey ? sortConfig.direction : 'asc'} onClick={() => handleSortRequest(column.sortKey)} sx={{ flexGrow: 1, '& .MuiTableSortLabel-icon': { ml: 0 } }}>
                                        {column.label}
                                        {sortConfig.key === column.sortKey ? <Box component="span" sx={visuallyHidden}>{sortConfig.direction === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box> : null}
                                    </TableSortLabel>
                                ) : (
                                    <span>{column.label}</span>
                                )}
                                {column.filterKey && (
                                    <Tooltip title="Filter">
                                        <IconButton size="small" onClick={(e) => handleOpenFilterMenu(e, column)} sx={{p: '4px'}}>
                                            <FilterListIcon fontSize="inherit" color={filters[column.filterKey]?.length > 0 ? 'primary' : 'inherit'} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        </th>
                        ))}
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentItems.map((item, index) => {
                        const isItemSelected = selectedItems.includes(item._id);
                        return (
                        <tr key={item._id} role="checkbox" aria-checked={isItemSelected} className={isItemSelected ? 'selected' : ''}>
                            {isSelectionModeActive ? (
                                <td><Checkbox color="primary" checked={isItemSelected} onChange={(event) => handleSelectOne(event, item._id)} /></td>
                            ) : (
                                <td data-label="SR. NO.">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            )}
                            
                            {displayColumns.map(column => (<td key={column.id} data-label={column.label}>{renderCellContent(item, column.id)}</td>))}
                            <td data-label="Actions" className="actions-cell">
                                <button className="action-btn edit" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></button>

                                <button className="action-btn delete" onClick={() => { setItemToDelete(item); setDeleteConfirmOpen(true); }}><DeleteIcon fontSize="small" /></button>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
                <Stack alignItems="center" sx={{ padding: 'var(--spacing-6)' }}>
                <Pagination count={Math.ceil(sortedInventory.length / itemsPerPage)} page={currentPage} onChange={(e, v) => setCurrentPage(v)} />
                </Stack>
            </>
            )}
        </div>
      
        <Menu
            anchorEl={filterMenu.anchorEl}
            open={Boolean(filterMenu.anchorEl)}
            onClose={handleCloseFilterMenu}
            MenuListProps={{ 'aria-labelledby': 'filter-menu' }}
            PaperProps={{ sx: { width: 320 } }}
        >
            <Box sx={{ px: 2, py: 1 }}>
                <TextField fullWidth variant="standard" placeholder="Search values..." value={filterSearchTerm} onChange={(e) => setFilterSearchTerm(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            </Box>
            <Divider />
            <List dense sx={{ maxHeight: 250, overflowY: 'auto', p: 0 }}>
                {displayedFilterOptions.map(option => (
                    <ListItem key={option} dense disablePadding sx={{pl: 1}}>
                        <ListItemIcon sx={{minWidth: 0}}>
                            <Checkbox edge="start" size="small" checked={tempFilterValues.includes(option)} onChange={() => handleTempFilterChange(option)} />
                        </ListItemIcon>
                        <ListItemText primary={<Typography variant="body2">{option}</Typography>} />
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                <Button onClick={handleClearColumnFilter} size="small" disabled={!filters[filterMenu.columnId]?.length && tempFilterValues.length === 0}>Clear</Button>
                <Button onClick={handleApplyFilters} variant="contained" size="small">Apply</Button>
            </Box>
        </Menu>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
            <DialogTitle>{isEditMode ? 'Update Robotics Item' : 'Add New Robotics Item'}</DialogTitle>
            <DialogContent sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2, pt: '10px !important' }}>
            {allFormFields.map(field => {
                if (field.type === 'select') {
                    return <FormControl key={field.id} fullWidth required={field.required}><InputLabel>{field.label}</InputLabel><Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}>{field.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</Select></FormControl>;
                }
                return <TextField key={field.id} name={field.id} label={field.label} type={field.type || 'text'} value={currentItemData[field.id] || ''} onChange={handleFormChange} required={field.required} multiline={field.multiline} rows={field.rows} InputLabelProps={field.type === 'date' ? { shrink: true } : {}} />;
            })}
            </DialogContent>
            <DialogActions sx={{ p: '16px 24px' }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveItem} variant="contained">{isEditMode ? 'Save Changes' : 'Add Item'}</Button></DialogActions>
        </Dialog>
      
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent><p>Delete "{itemToDelete?.partName}" (SKU: {itemToDelete?.sku || 'N/A'})?</p></DialogContent>
            <DialogActions><Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button onClick={handleDeleteItem} color="error" variant="contained">Delete</Button></DialogActions>
        </Dialog>

        <Dialog open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)}>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogContent><p>Are you sure you want to delete the <strong>{selectedItems.length}</strong> selected items? This action cannot be undone.</p></DialogContent>
            <DialogActions><Button onClick={() => setBulkDeleteConfirmOpen(false)}>Cancel</Button><Button onClick={handleExecuteBulkDelete} color="error" variant="contained">Delete All</Button></DialogActions>
        </Dialog>
        
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
    </div>
  );
}

export default RoboticsInventoryPage;