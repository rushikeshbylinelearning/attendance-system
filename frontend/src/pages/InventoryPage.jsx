import React, { useState, useEffect, useMemo } from 'react';
import api from '@/services/api';
import '../styles/InventoryPage.css'; // This CSS file is correct
import WarrantyStatus from '@/components/WarrantyStatus';

import {
  Alert, Pagination, Stack, Link, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Checkbox, FormControlLabel,
  Toolbar, Typography, Tooltip, IconButton, Box, CircularProgress, TableSortLabel,
  Menu, List, ListItem, ListItemText, Divider, ListItemIcon, 
  InputAdornment
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { alpha } from '@mui/material/styles';
import { 
    Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, 
    FilterList as FilterListIcon 
} from '@mui/icons-material';

// --- All configs remain the same ---
const allFormFields = [
  { id: 'componentType', label: 'Component Type', required: true, type: 'select_component' },
  { id: 'brand', label: 'Brand', required: true },
  { id: 'model', label: 'Model' },
  { id: 'serialNumber', label: 'Serial Number' },
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
const baseDisplayColumns = [
  { id: 'componentType', label: 'Component', sortKey: 'componentType', filterKey: 'componentType' },
  { id: 'brandAndModel', label: 'Brand & Model', sortKey: 'brand', filterKey: 'brand' },
  { id: 'serialNumber', label: 'Serial No.', sortKey: 'serialNumber' },
  { id: 'warranty', label: 'Warranty', sortKey: 'warrantyExpiry' },
  { id: 'invoiceLink', label: 'Invoice' },
  { id: 'status', label: 'Status', sortKey: 'status', filterKey: 'status' },
  { id: 'lastUpdated', label: 'Last Updated', sortKey: 'updatedAt' },
];
const specColumns = [
    { id: 'processor', label: 'Processor', sortKey: 'specifications.processor', filterKey: 'specifications.processor' },
    { id: 'ram', label: 'RAM', sortKey: 'specifications.ram', filterKey: 'specifications.ram' },
    { id: 'graphicCard', label: 'Graphic Card', sortKey: 'specifications.graphicCard', filterKey: 'specifications.graphicCard' },
];
const initialFormState = allFormFields.reduce((acc, col) => ({ ...acc, [col.id]: col.type === 'checkbox' ? false : '' }), {});
const bulkUpdateableFields = [
    { id: 'status', label: 'Status', type: 'select', options: ['Unassigned', 'Assigned', 'In-Repair', 'Retired'] },
    { id: 'purchaseDate', label: 'Purchase Date', type: 'date' },
    { id: 'warrantyYears', label: 'Warranty (Years)', type: 'number' },
    { id: 'isWarrantyRegistered', label: 'Warranty Registered', type: 'boolean' }
];
const getNestedValue = (obj, path) => {
    if (!path) return undefined;
    return path.split('.').reduce((o, i) => (o && o[i] !== undefined) ? o[i] : null, obj);
}

function InventoryPage() {
  // All state declarations remain the same
  const [inventory, setInventory] = useState([]);
  const [users, setUsers] = useState([]);
  const [componentTypes, setComponentTypes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
  const [filters, setFilters] = useState({});
  const [filterMenu, setFilterMenu] = useState({ anchorEl: null, columnId: null });
  const [tempFilterValues, setTempFilterValues] = useState([]);
  const [filterSearchTerm, setFilterSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItemData, setCurrentItemData] = useState(initialFormState);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({ field: '', value: '' });
  const [isSelectAllPages, setIsSelectAllPages] = useState(false);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);

  // All hooks and handlers (useEffect, useMemo, handleSave, etc.) remain exactly the same
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [invRes, usersRes, typesRes] = await Promise.all([
          api.get('/inventory'), 
          api.get('/users'),
          api.get('/component-types')
        ]);
        setInventory(invRes.data);
        setUsers(usersRes.data);
        setComponentTypes(typesRes.data);
        setError('');
      } catch (err) { 
        setError('Could not load data. Ensure you are logged in and have the correct permissions.'); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchInitialData();
  }, []);

  const searchedInventory = useMemo(() => 
    inventory.filter(item =>
      Object.values(item).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase())) ||
      Object.values(item.specifications || {}).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
    ), [inventory, searchTerm]);

  const filteredInventory = useMemo(() => {
    const activeFilterKeys = Object.keys(filters).filter(key => filters[key]?.length > 0);
    if (activeFilterKeys.length === 0) return searchedInventory;
    return searchedInventory.filter(item => {
        return activeFilterKeys.every(key => {
            const itemValue = getNestedValue(item, key);
            return filters[key].includes(String(itemValue));
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

  const shouldShowSpecColumns = useMemo(() => 
    currentItems.some(item => ['CPU', 'Laptop'].includes(item.componentType)),
    [currentItems]
  );
  
  const activeDisplayColumns = useMemo(() => {
      if (shouldShowSpecColumns) {
          const serialNumberIndex = baseDisplayColumns.findIndex(c => c.id === 'serialNumber');
          const newColumns = [...baseDisplayColumns];
          newColumns.splice(serialNumberIndex + 1, 0, ...specColumns);
          return newColumns;
      }
      return baseDisplayColumns;
  }, [shouldShowSpecColumns]);
  
  const handleSortRequest = (property) => {
    const isAsc = sortConfig.key === property && sortConfig.direction === 'asc';
    setSortConfig({ key: property, direction: isAsc ? 'desc' : 'asc' });
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
    setFilters(prev => ({
        ...prev,
        [filterMenu.columnId]: tempFilterValues,
    }));
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
    const values = searchedInventory.map(item => String(getNestedValue(item, filterMenu.columnId)));
    return [...new Set(values)].filter(v => v !== 'null' && v !== 'undefined' && v.trim() !== '').sort();
  }, [filterMenu.columnId, searchedInventory]);

  const displayedFilterOptions = useMemo(() => {
    if (!filterSearchTerm) return allFilterOptions;
    return allFilterOptions.filter(opt => opt.toLowerCase().includes(filterSearchTerm.toLowerCase()));
  }, [allFilterOptions, filterSearchTerm]);

  const handleSelectAllVisible = (event) => {
    if (event.target.checked) {
        const newSelected = [...new Set([...tempFilterValues, ...displayedFilterOptions])];
        setTempFilterValues(newSelected);
    } else {
        setTempFilterValues(tempFilterValues.filter(v => !displayedFilterOptions.includes(v)));
    }
  };
  const areAllVisibleSelected = displayedFilterOptions.length > 0 && displayedFilterOptions.every(opt => tempFilterValues.includes(opt));
  const isAnyVisibleSelected = displayedFilterOptions.some(opt => tempFilterValues.includes(opt));

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setIsSelectionModeActive(true);
        setSelectedItems(currentItems.map(item => item._id));
      }
      if (event.key === 'Escape') {
        setIsSelectionModeActive(false);
        setSelectedItems([]);
        setIsSelectAllPages(false);
        handleCloseFilterMenu();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentItems]);

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
    if (name === 'status' && value !== 'Assigned') newData.assignedTo = '';
    if (name === 'assignedTo' && value) newData.status = 'Assigned';
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
        setInventory(inventory.map(i => i._id === response.data._id ? response.data : i));
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedItems([]);
    setIsSelectAllPages(false);
    setCurrentPage(1);
  };
  
  const handlePageChange = (e, value) => {
    setCurrentPage(value);
    setSelectedItems([]);
    setIsSelectAllPages(false);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedItems(currentItems.map((item) => item._id));
      return;
    }
    setSelectedItems([]);
    setIsSelectAllPages(false);
  };
  
  const handleSelectAllFiltered = () => {
    setSelectedItems(sortedInventory.map((item) => item._id));
    setIsSelectAllPages(true);
  };

  const handleSelectOne = (event, id) => {
    const selectedIndex = selectedItems.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) newSelected = newSelected.concat(selectedItems, id);
    else if (selectedIndex === 0) newSelected = newSelected.concat(selectedItems.slice(1));
    else if (selectedIndex === selectedItems.length - 1) newSelected = newSelected.concat(selectedItems.slice(0, -1));
    else if (selectedIndex > 0) newSelected = newSelected.concat(selectedItems.slice(0, selectedIndex), selectedItems.slice(selectedIndex + 1));
    
    setSelectedItems(newSelected);
    setIsSelectAllPages(false);
  };
  
  const handleBulkUpdateFieldChange = (e) => { setBulkUpdateData({ ...bulkUpdateData, field: e.target.value, value: '' }); };
  const handleBulkUpdateValueChange = (e) => { const { value, type, checked } = e.target; setBulkUpdateData({ ...bulkUpdateData, value: type === 'checkbox' ? checked : value }); };
  
  const handleExecuteBulkUpdate = async () => {
    if (!bulkUpdateData.field) {
        setSnackbar({ open: true, message: 'Please select a field to update.', severity: 'error'});
        return;
    }
    setLoading(true);
    try {
        await api.put('/inventory/bulk-update', { ids: selectedItems, field: bulkUpdateData.field, value: bulkUpdateData.value });
        const invRes = await api.get('/inventory');
        setInventory(invRes.data);
        setSnackbar({ open: true, message: `${selectedItems.length} items updated successfully!`, severity: 'success' });
        setBulkUpdateDialogOpen(false);
        setSelectedItems([]);
        setBulkUpdateData({ field: '', value: '' });
        setIsSelectAllPages(false);
    } catch (err) {
        setSnackbar({ open: true, message: `Error: ${err.response?.data?.msg || 'Bulk update failed.'}`, severity: 'error' });
    } finally {
        setLoading(false);
    }
  };

  const handleExecuteBulkDelete = async () => {
    setLoading(true);
    try {
        await api.post('/inventory/bulk-delete', { ids: selectedItems });
        setInventory(inventory.filter(item => !selectedItems.includes(item._id)));
        setSnackbar({ open: true, message: `${selectedItems.length} items deleted!`, severity: 'warning' });
    } catch (err) {
        setSnackbar({ open: true, message: `Error: ${err.response?.data?.msg || 'Bulk delete failed.'}`, severity: 'error' });
    } finally {
        setBulkDeleteConfirmOpen(false);
        setSelectedItems([]);
        setIsSelectAllPages(false);
        setLoading(false);
    }
  };

  const renderCellContent = (item, columnId) => {
    switch(columnId) {
        case 'componentType':
            return item.componentType;
        case 'brandAndModel':
            return `${item.brand} ${item.model || ''}`;
        case 'serialNumber':
            return item.serialNumber || 'N/A';
        case 'processor':
            return item.specifications?.processor || 'N/A';
        case 'ram':
            return item.specifications?.ram || 'N/A';
        case 'graphicCard':
            return item.specifications?.graphicCard || 'N/A';
        case 'warranty':
            return <WarrantyStatus expiryDate={item.warrantyExpiry} />;
        case 'invoiceLink':
            return item.invoiceLink ? <Link href={item.invoiceLink} target="_blank" rel="noopener">View</Link> : 'N/A';
        case 'status':
            return <span className={`status-chip ${String(item.status).toLowerCase().replace(/\s+/g, '-')}`}>{item.status}</span>;
        case 'lastUpdated':
            return new Date(item.updatedAt).toLocaleString();
        default:
            return 'N/A';
    }
  };

  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;

  const showSelectAllFilteredBanner = isSelectionModeActive && selectedItems.length === currentItems.length && !isSelectAllPages && sortedInventory.length > itemsPerPage;

  // ===== THE FIX IS HERE =====
  // We use a single root div with the main class name.
  // The React Fragment <> </> has been removed.
  // All dialogs are now *inside* this main container.
  return (
    <div className="inventory-page-container">
      <div className="inventory-content-wrapper">
        <header className="inventory-list-header">
          <h1 className="inventory-list-title">Component Inventory</h1>
          <button className="add-item-btn" onClick={() => handleOpenDialog()}><AddIcon /> Add Item</button>
        </header>

        {isSelectionModeActive && selectedItems.length > 0 ? (
          <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, mb: 2, borderRadius: 1, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15), flexDirection: 'column', alignItems: 'stretch', p: '0 !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: '0 8px 0 16px' }}>
                  <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
                    {isSelectAllPages ? `All ${selectedItems.length} items selected` : `${selectedItems.length} selected`}
                  </Typography>
                  <Tooltip title="Update Selected"><IconButton onClick={() => setBulkUpdateDialogOpen(true)}><EditIcon /></IconButton></Tooltip>
                  <Tooltip title="Delete Selected"><IconButton onClick={() => setBulkDeleteConfirmOpen(true)}><DeleteIcon /></IconButton></Tooltip>
              </Box>
              {showSelectAllFilteredBanner && (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Typography variant="body2">
                        All {selectedItems.length} items on this page are selected.{' '}
                        <Link component="button" variant="body2" onClick={handleSelectAllFiltered} sx={{fontWeight: 'bold'}}>
                            Select all {sortedInventory.length} items
                        </Link>
                    </Typography>
                  </Box>
              )}
          </Toolbar>
        ) : (
          <div className="inventory-filters-container">
            <div className="filter-input-group">
              <SearchIcon className="filter-icon" />
              <input type="text" className="filter-input has-icon" placeholder="Search inventory... (Ctrl+A to select)" value={searchTerm} onChange={handleSearchChange} />
            </div>
          </div>
        )}
        
        {loading ? (<Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh'}}><CircularProgress /></Box>) : (
          <>
            <div className="inventory-table-container">
              <table className="inventory-list-table">
                <thead>
                  <tr>
                    {isSelectionModeActive ? (
                      <th>
                        <Checkbox color="primary"
                          indeterminate={!isSelectAllPages && selectedItems.length > 0 && selectedItems.length < currentItems.length}
                          checked={isSelectAllPages || (currentItems.length > 0 && selectedItems.length === currentItems.length)}
                          onChange={handleSelectAll} inputProps={{ 'aria-label': 'select all items on this page' }}/>
                      </th>
                    ) : (
                      <th>SR. NO.</th>
                    )}
                    {activeDisplayColumns.map(column => (
                      <th key={column.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'space-between' }}>
                              {column.sortKey ? (
                                  <TableSortLabel
                                      active={sortConfig.key === column.sortKey}
                                      direction={sortConfig.key === column.sortKey ? sortConfig.direction : 'asc'}
                                      onClick={() => handleSortRequest(column.sortKey)}
                                      sx={{flexGrow: 1}}
                                  >
                                      {column.label}
                                      {sortConfig.key === column.sortKey ? <Box component="span" sx={visuallyHidden}>{sortConfig.direction === 'desc' ? 'sorted descending' : 'sorted ascending'}</Box> : null}
                                  </TableSortLabel>
                              ) : (
                                  <span>{column.label}</span>
                              )}
                              {column.filterKey && (
                                  <Tooltip title="Filter">
                                      <IconButton size="small" onClick={(e) => handleOpenFilterMenu(e, column)}>
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
                    const isItemSelected = selectedItems.indexOf(item._id) !== -1;
                    return (
                      <tr key={item._id} role="checkbox" aria-checked={isItemSelected} tabIndex={-1} selected={isItemSelected}>
                        {isSelectionModeActive ? (
                          <td>
                            <Checkbox color="primary" checked={isItemSelected} onChange={(event) => handleSelectOne(event, item._id)}
                              inputProps={{ 'aria-labelledby': `inventory-table-checkbox-${index}` }}/>
                          </td>
                        ) : (
                          <td data-label="SR. NO.">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        )}
                        {activeDisplayColumns.map(column => (
                          <td key={column.id} data-label={column.label}>
                              {renderCellContent(item, column.id)}
                          </td>
                        ))}
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
              <Pagination count={Math.ceil(sortedInventory.length / itemsPerPage)} page={currentPage} onChange={handlePageChange} />
            </Stack>
          </>
        )}
      </div>
      
      <Menu
        anchorEl={filterMenu.anchorEl}
        open={Boolean(filterMenu.anchorEl)}
        onClose={handleCloseFilterMenu}
        MenuListProps={{ 'aria-labelledby': 'filter-menu' }}
        PaperProps={{ sx: { width: 320, } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
            <TextField
                fullWidth
                variant="standard"
                placeholder="Search..."
                value={filterSearchTerm}
                onChange={(e) => setFilterSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                }}
            />
        </Box>
        <Divider />
        <List dense sx={{ maxHeight: 250, overflowY: 'auto', p: 0 }}>
             <ListItem sx={{py: 0}}>
                <FormControlLabel
                    label="Select All (Visible)"
                    control={<Checkbox
                        size="small"
                        checked={areAllVisibleSelected}
                        indeterminate={isAnyVisibleSelected && !areAllVisibleSelected}
                        onChange={handleSelectAllVisible}
                    />}
                />
            </ListItem>
            {displayedFilterOptions.map(option => (
                <ListItem key={option} dense disablePadding sx={{pl: 1}}>
                    <ListItemIcon sx={{minWidth: 0}}>
                        <Checkbox
                            edge="start"
                            size="small"
                            checked={tempFilterValues.includes(option)}
                            onChange={() => handleTempFilterChange(option)}
                        />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{option || 'N/A'}</Typography>} />
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
        <DialogTitle>{isEditMode ? 'Update Inventory Item' : 'Add New Item'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2, pt: '10px !important' }}>
          {allFormFields.map(field => {
            const isCpuField = field.group === 'cpu' && !['CPU', 'Laptop'].includes(currentItemData.componentType);
            if (isCpuField) return null;
            const isAssignedToDisabled = field.id === 'assignedTo' && currentItemData.status !== 'Assigned';
            if (field.type === 'select_component') {
              return <FormControl key={field.id} fullWidth required={field.required}><InputLabel>{field.label}</InputLabel><Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}><MenuItem value="" disabled><em>Select a type...</em></MenuItem>{componentTypes.map(type => <MenuItem key={type._id} value={type.name}>{type.name}</MenuItem>)}</Select></FormControl>;
            }
            if (field.type === 'select') {
              return <FormControl key={field.id} fullWidth><InputLabel>{field.label}</InputLabel><Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}>{field.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</Select></FormControl>
            }
            if (field.type === 'select_user') {
              return <FormControl key={field.id} fullWidth disabled={isAssignedToDisabled}><InputLabel>{field.label}</InputLabel><Select name={field.id} value={currentItemData[field.id] || ''} label={field.label} onChange={handleFormChange}><MenuItem value=""><em>None</em></MenuItem>{users.map(u => <MenuItem key={u._id} value={u._id}>{u.name}</MenuItem>)}</Select></FormControl>
            }
            if (field.type === 'checkbox') {
              return <FormControlLabel control={<Checkbox name={field.id} checked={!!currentItemData[field.id]} onChange={handleFormChange} />} label={field.label} sx={{ gridColumn: '1 / -1' }} />
            }
            return <TextField key={field.id} name={field.id} label={field.label} type={field.type || 'text'} value={currentItemData[field.id] || ''} onChange={handleFormChange} required={field.required} InputLabelProps={field.type === 'date' ? { shrink: true } : {}} />
          })}
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveItem} variant="contained">{isEditMode ? 'Save Changes' : 'Add Item'}</Button></DialogActions>
      </Dialog>
      
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><p>Delete "{itemToDelete?.componentType} - {itemToDelete?.serialNumber}"?</p></DialogContent>
        <DialogActions><Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button><Button onClick={handleDeleteItem} color="error" variant="contained">Delete</Button></DialogActions>
      </Dialog>
      
      <Dialog open={bulkUpdateDialogOpen} onClose={() => setBulkUpdateDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Bulk Update Items</DialogTitle>
        <DialogContent>
            <Typography variant="body1" gutterBottom>Update a field for all <strong>{selectedItems.length}</strong> selected items.</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <FormControl fullWidth><InputLabel>Field to Update</InputLabel>
                    <Select value={bulkUpdateData.field} label="Field to Update" onChange={handleBulkUpdateFieldChange}>
                        <MenuItem value="" disabled><em>Select a field...</em></MenuItem>
                        {bulkUpdateableFields.map(field => (<MenuItem key={field.id} value={field.id}>{field.label}</MenuItem>))}
                    </Select>
                </FormControl>
                {bulkUpdateData.field && (() => {
                    const fieldConfig = bulkUpdateableFields.find(f => f.id === bulkUpdateData.field);
                    switch(fieldConfig.type) {
                        case 'select': return (<FormControl fullWidth><InputLabel>New Value</InputLabel><Select value={bulkUpdateData.value} label="New Value" onChange={handleBulkUpdateValueChange}>{fieldConfig.options.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}</Select></FormControl>);
                        case 'date': return <TextField label="New Value" type="date" value={bulkUpdateData.value} onChange={handleBulkUpdateValueChange} fullWidth InputLabelProps={{ shrink: true }} />;
                        case 'boolean': return <FormControlLabel control={<Checkbox checked={!!bulkUpdateData.value} onChange={handleBulkUpdateValueChange} />} label={fieldConfig.label} />;
                        default: return <TextField label="New Value" type={fieldConfig.type || 'text'} value={bulkUpdateData.value} onChange={handleBulkUpdateValueChange} fullWidth />;
                    }
                })()}
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setBulkUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleExecuteBulkUpdate} variant="contained" disabled={!bulkUpdateData.field}>Apply Changes</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Bulk Deletion</DialogTitle>
        <DialogContent><p>Are you sure you want to delete the <strong>{selectedItems.length}</strong> selected items? This action cannot be undone.</p></DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleExecuteBulkDelete} color="error" variant="contained">Delete All</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </div>
  );
}

export default InventoryPage;