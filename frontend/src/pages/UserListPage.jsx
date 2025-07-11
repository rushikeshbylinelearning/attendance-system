import React, { useState, useEffect, useMemo } from 'react';
import api, { addUser, deleteUser, updateUser } from '@/services/api';
import { socket } from '@/services/socket';
import '../styles/UserListPage.css'; // Make sure this path is correct

import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Button,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';

const initialFormState = {
  name: '', email: '', password: '', employeeId: '', seatNumber: '', role: 'employee',
};

function UserListPage() {
  // Core component state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog and form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialFormState);

  // Deletion confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // UI state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for selection functionality, toggled by hotkey
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isBulkModeVisible, setIsBulkModeVisible] = useState(false);

  // Hotkey effect to toggle bulk selection mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'F5') {
        event.preventDefault();
        setIsBulkModeVisible(prev => {
          if (prev) setSelectedUsers(new Set());
          setSnackbar({ 
            open: true, 
            message: `Bulk selection mode ${!prev ? 'enabled' : 'disabled'}.`, 
            severity: 'info' 
          });
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Socket and Data Fetching Effects
  useEffect(() => {
    socket.connect();
    const onUserAdded = (newUser) => {
      setUsers(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
      setSnackbar({ open: true, message: `User ${newUser.name} added!`, severity: 'success' });
    };
    const onUserDeleted = (deletedUserId) => {
      const ids = Array.isArray(deletedUserId) ? deletedUserId : [deletedUserId];
      setUsers(prev => prev.filter(user => !ids.includes(user._id)));
      setSnackbar({ 
        open: true, 
        message: `${ids.length} user${ids.length > 1 ? 's' : ''} deleted successfully!`, 
        severity: 'warning' 
      });
    };
    const onUserUpdated = (updatedUser) => {
      setUsers(prev => prev.map(user => (user._id === updatedUser._id ? updatedUser : user)).sort((a, b) => a.name.localeCompare(b.name)));
      setSnackbar({ open: true, message: `User ${updatedUser.name}'s details updated!`, severity: 'info' });
    };
    socket.on('userAdded', onUserAdded);
    socket.on('userDeleted', onUserDeleted);
    socket.on('userUpdated', onUserUpdated);
    return () => {
      socket.off('userAdded', onUserAdded);
      socket.off('userDeleted', onUserDeleted);
      socket.off('userUpdated', onUserUpdated);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users');
        setUsers(response.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        setError(err.response?.data?.msg || 'You do not have permission to view this page.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  // --- FIX: Added defensive checks (|| '') to prevent 'toLowerCase of undefined' error ---
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Handlers
  const handleFormChange = (e) => setCurrentUser({...currentUser, [e.target.name]: e.target.value});
  
  const handleSelectAll = (event) => {
    if (event.target.checked) setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
    else setSelectedUsers(new Set());
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(userId)) newSelected.delete(userId);
      else newSelected.add(userId);
      return newSelected;
    });
  };

  const handleSaveUser = async () => {
    try {
      if (isEditMode) {
        const { name, email, employeeId, seatNumber, role, password } = currentUser;
        const dataToUpdate = { name, email, employeeId, seatNumber, role };
        if (password && password.trim() !== '') dataToUpdate.password = password;
        await updateUser(currentUser._id, dataToUpdate);
      } else {
        await addUser(currentUser);
      }
      setDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.msg || 'An error occurred.', severity: 'error' });
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete._id);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Failed to delete user.', severity: 'error' });
    }
  };
  
  const handleBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedUsers).map(id => deleteUser(id)));
      setSelectedUsers(new Set());
      setBulkDeleteConfirmOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Failed to delete some users.', severity: 'error' });
    }
  };

  if (error) {
    return <div className="user-page-container"><Alert severity="error" sx={{ m: 4 }}>{error}</Alert></div>;
  }

  return (
    <div className="user-page-container">
      <div className="user-content-wrapper">
        <header className="user-list-header">
          <h1 className="user-list-title">User Management</h1>
          <button className="new-user-btn" onClick={() => { setIsEditMode(false); setCurrentUser(initialFormState); setDialogOpen(true); }}>
            <AddIcon /> Add New User
          </button>
        </header>

        <div className="user-filters-container">
          <div className="filter-input-group">
            <SearchIcon className="filter-icon" />
            <input
              type="text"
              className="filter-input has-icon"
              placeholder="Search by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isBulkModeVisible && (
            <Button
              variant="contained"
              color="error"
              disabled={selectedUsers.size === 0}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              startIcon={<DeleteIcon />}
              sx={{ borderRadius: 'var(--radius-lg)' }}
            >
              Delete Selected ({selectedUsers.size})
            </Button>
          )}
        </div>

        {loading ? (
          <div className="user-page-feedback-wrapper">
            <div className="user-page-loading">
              <div className="user-page-spinner"></div>
              <p className="user-page-loading-text">Loading Users...</p>
            </div>
          </div>
        ) : (
          <div className="user-table-container">
            <table className="user-list-table">
              <thead>
                <tr>
                  {isBulkModeVisible && (
                    <th style={{ width: '50px' }}>
                      <Checkbox
                        indeterminate={selectedUsers.size > 0 && selectedUsers.size < filteredUsers.length}
                        checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {/* Added Sr. No. Header */}
                  <th>SR. NO.</th> 
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user._id} className={selectedUsers.has(user._id) ? 'selected-row' : ''}>
                    {isBulkModeVisible && (
                      <td><Checkbox checked={selectedUsers.has(user._id)} onChange={() => handleSelectUser(user._id)} /></td>
                    )}
                    {/* Added Sr. No. Data Cell */}
                    <td data-label="SR. NO.">{index + 1}</td>
                    <td data-label="Name">{user.name}</td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Employee ID">{user.employeeId || 'N/A'}</td>
                    <td data-label="Role">
                      <span className={`role-chip role-${user.role || 'default'}`}>{user.role}</span>
                    </td>
                    <td data-label="Joined">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td data-label="Actions" className="actions-cell">
                      <button className="action-btn" onClick={() => { setIsEditMode(true); setCurrentUser({ ...user, password: '' }); setDialogOpen(true); }} title="Edit User">
                        <EditIcon fontSize="small" />
                      </button>
                      <button className="action-btn delete" onClick={() => { setUserToDelete(user); setDeleteConfirmOpen(true); }} title="Delete User">
                        <DeleteIcon fontSize="small" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Full Name" type="text" fullWidth variant="outlined" value={currentUser.name} onChange={handleFormChange} />
          <TextField margin="dense" name="email" label="Email Address" type="email" fullWidth variant="outlined" value={currentUser.email} onChange={handleFormChange} />
          <TextField margin="dense" name="employeeId" label="Employee ID" type="text" fullWidth variant="outlined" value={currentUser.employeeId} onChange={handleFormChange} />
          <TextField margin="dense" name="seatNumber" label="Seat Number" type="text" fullWidth variant="outlined" value={currentUser.seatNumber} onChange={handleFormChange} />
          {/* --- FIX: Corrected typo from e.gittarget to e.target --- */}
          <TextField margin="dense" name="password" label={isEditMode ? "New Password (leave blank to keep)" : "Password"} type="password" fullWidth variant="outlined" value={currentUser.password} onChange={handleFormChange}/>
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Role</InputLabel>
            <Select name="role" value={currentUser.role} label="Role" onChange={handleFormChange}>
              <MenuItem value="intern">Intern</MenuItem><MenuItem value="employee">Employee</MenuItem><MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">{isEditMode ? 'Save Changes' : 'Add User'}</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete "{userToDelete?.name}"? This is irreversible.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Bulk Deletion</DialogTitle>
        <DialogContent><DialogContentText>Delete <strong>{selectedUsers.size} selected users</strong>? This is irreversible.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkDelete} color="error" variant="contained">Delete All</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}

export default UserListPage;