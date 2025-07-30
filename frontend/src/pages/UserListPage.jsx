import React, { useState, useEffect, useMemo } from 'react';
import api, { addUser, deleteUser, updateUser } from '@/services/api';
import { socket } from '@/services/socket';
import '../styles/UserListPage.css';

import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Button,
  Checkbox, CircularProgress, Box,
} from '@mui/material';
import { 
    Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon,
    Person as PersonIcon, Assignment as AssignmentIcon, ConfirmationNumber as ConfirmationNumberIcon
} from '@mui/icons-material';

// --- NEW: User Snapshot Modal Component ---
const UserSnapshotModal = ({ isOpen, onClose, user }) => {
  const [details, setDetails] = useState({ allocations: [], ticketStats: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    const fetchUserDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch allocations and ticket stats in parallel for efficiency
        const [allocationsRes, ticketsRes] = await Promise.all([
          api.get(`/allocations/user/${user._id}`),
          api.get(`/tickets/user-stats/${user._id}`) // Assumes an endpoint that returns { total, open, closed }
        ]);
        setDetails({
          allocations: allocationsRes.data,
          ticketStats: ticketsRes.data
        });
      } catch (err) {
        console.error("Failed to fetch user snapshot details:", err);
        setError("Could not load additional user details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="snapshot-modal-backdrop" onClick={onClose}>
      <div className="snapshot-modal-container" onClick={e => e.stopPropagation()}>
        <div className="snapshot-modal-header">
          <div>
            <h2 className="snapshot-modal-title">{user.name}</h2>
            <span className={`role-chip role-${user.role || 'default'}`}>{user.role}</span>
          </div>
          <button className="snapshot-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="snapshot-modal-body">
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%"><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <div className="snapshot-grid">
              {/* Profile Details Section */}
              <div className="snapshot-card">
                <div className="snapshot-card-header"><PersonIcon /><h3>Profile Details</h3></div>
                <div className="snapshot-card-content">
                  <div className="detail-item"><span>Email</span><span>{user.email}</span></div>
                  <div className="detail-item"><span>Employee ID</span><span>{user.employeeId || 'N/A'}</span></div>
                  <div className="detail-item"><span>Domain/Dept</span><span>{user.domain || 'N/A'}</span></div>
                  <div className="detail-item"><span>Seat Number</span><span>{user.seatNumber || 'N/A'}</span></div>
                  <div className="detail-item"><span>Joined On</span><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Ticket Stats Section */}
              <div className="snapshot-card">
                <div className="snapshot-card-header"><ConfirmationNumberIcon /><h3>Ticket Summary</h3></div>
                <div className="snapshot-card-content is-stats-grid">
                  <div className="stat-box">
                    <span className="stat-value">{details.ticketStats?.total ?? 0}</span>
                    <span className="stat-label">Total Tickets</span>
                  </div>
                  <div className="stat-box open">
                    <span className="stat-value">{details.ticketStats?.open ?? 0}</span>
                    <span className="stat-label">Open</span>
                  </div>
                  <div className="stat-box closed">
                    <span className="stat-value">{details.ticketStats?.closed ?? 0}</span>
                    <span className="stat-label">Closed</span>
                  </div>
                </div>
              </div>

              {/* Allocated Assets Section */}
              <div className="snapshot-card full-width">
                <div className="snapshot-card-header"><AssignmentIcon /><h3>Allocated Assets</h3></div>
                <div className="snapshot-card-content">
                  {details.allocations.length > 0 ? (
                    <ul className="asset-list">
                      {details.allocations.map(alloc => (
                        <li key={alloc._id}>
                          <span>{alloc.componentId.name}</span>
                          <span className="asset-serial">{alloc.componentId.serialNumber || 'No S/N'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-assets-message">No assets are currently allocated to this user.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const initialFormState = {
  name: '', email: '', password: '', employeeId: '', seatNumber: '', role: 'employee', domain: '',
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

  // Snapshot modal state
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);
  const [selectedUserForSnapshot, setSelectedUserForSnapshot] = useState(null);

  // Deletion confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // UI state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for selection functionality
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isBulkModeVisible, setIsBulkModeVisible] = useState(false);

  // Hotkey effect to toggle bulk selection mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        setIsBulkModeVisible(prev => {
          if (prev) setSelectedUsers(new Set());
          setSnackbar({ open: true, message: `Bulk selection mode ${!prev ? 'enabled' : 'disabled'}.`, severity: 'info' });
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
      setUsers(prev => [...prev, newUser]);
      setSnackbar({ open: true, message: `User ${newUser.name} added!`, severity: 'success' });
    };
    const onUserDeleted = (deletedUserId) => {
      const ids = Array.isArray(deletedUserId) ? deletedUserId : [deletedUserId];
      setUsers(prev => prev.filter(user => !ids.includes(user._id)));
      setSnackbar({ open: true, message: `${ids.length} user${ids.length > 1 ? 's' : ''} deleted successfully!`, severity: 'warning' });
    };
    const onUserUpdated = (updatedUser) => {
      setUsers(prev => prev.map(user => (user._id === updatedUser._id ? updatedUser : user)));
      setSnackbar({ open: true, message: `User ${updatedUser.name}'s details updated!`, severity: 'info' });
    };
    socket.on('userAdded', onUserAdded);
    socket.on('userDeleted', onUserDeleted);
    socket.on('userUpdated', onUserUpdated);
    return () => {
      socket.off('userAdded'); socket.off('userDeleted'); socket.off('userUpdated');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users');
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.msg || 'You do not have permission to view this page.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  
  const sortedAndFilteredUsers = useMemo(() => {
    const filtered = users.filter(user =>
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [users, searchTerm]);

  // Handlers
  const handleFormChange = (e) => setCurrentUser({...currentUser, [e.target.name]: e.target.value});
  
  const handleSelectAll = (event) => {
    if (event.target.checked) setSelectedUsers(new Set(sortedAndFilteredUsers.map(u => u._id)));
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

  const handleRowClick = (user) => {
    if (isBulkModeVisible) {
      handleSelectUser(user._id);
      return;
    }
    // Open snapshot modal if not in bulk mode
    setSelectedUserForSnapshot(user);
    setSnapshotModalOpen(true);
  };
  
  const handleSaveUser = async () => {
    try {
      if (isEditMode) {
        const { name, email, employeeId, seatNumber, role, password, domain } = currentUser;
        const dataToUpdate = { name, email, employeeId, seatNumber, role, domain };
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
          <button className="new-user-btn" onClick={() => { 
            setIsEditMode(false); 
            setCurrentUser(initialFormState); 
            setDialogOpen(true);
            setSearchTerm('');
          }}>
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
                        indeterminate={selectedUsers.size > 0 && selectedUsers.size < sortedAndFilteredUsers.length}
                        checked={sortedAndFilteredUsers.length > 0 && selectedUsers.size === sortedAndFilteredUsers.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                  )}
                  <th>SR. NO.</th> 
                  <th>Name</th>
                  <th>Email</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Domain</th>
                  <th>Register</th>
                  <th style={{textAlign: 'right'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredUsers.map((user, index) => (
                  <tr 
                    key={user._id} 
                    className={`${selectedUsers.has(user._id) ? 'selected-row' : ''} ${!isBulkModeVisible ? 'is-clickable' : ''}`}
                    onClick={() => handleRowClick(user)}
                  >
                    {isBulkModeVisible && (
                      <td><Checkbox checked={selectedUsers.has(user._id)} onChange={(e) => { e.stopPropagation(); handleSelectUser(user._id);}} /></td>
                    )}
                    <td data-label="SR. NO.">{index + 1}</td>
                    <td data-label="Name">{user.name}</td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Employee ID">{user.employeeId || 'N/A'}</td>
                    <td data-label="Role">
                      <span className={`role-chip role-${user.role || 'default'}`}>{user.role}</span>
                    </td>
                    <td data-label="Domain">{user.domain || 'N/A'}</td>
                    <td data-label="Register">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td data-label="Actions" className="actions-cell">
                      <div className="actions-group" onClick={e => e.stopPropagation()}>
                        <button className="action-btn" onClick={() => { setIsEditMode(true); setCurrentUser({ ...user, password: '' }); setDialogOpen(true); }} title="Edit User">
                          <EditIcon fontSize="small" />
                        </button>
                        <button className="action-btn delete" onClick={() => { setUserToDelete(user); setDeleteConfirmOpen(true); }} title="Delete User">
                          <DeleteIcon fontSize="small" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main User Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        {/* ... same dialog content as before ... */}
        <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" name="name" label="Full Name" type="text" fullWidth variant="outlined" value={currentUser.name} onChange={handleFormChange} />
          <TextField margin="dense" name="email" label="Email Address" type="email" fullWidth variant="outlined" value={currentUser.email} onChange={handleFormChange} />
          <TextField margin="dense" name="employeeId" label="Employee ID" type="text" fullWidth variant="outlined" value={currentUser.employeeId} onChange={handleFormChange} />
          <TextField margin="dense" name="seatNumber" label="Seat Number" type="text" fullWidth variant="outlined" value={currentUser.seatNumber} onChange={handleFormChange} />
          <TextField 
            margin="dense" 
            name="domain" 
            label="Domain / Department" 
            type="text" 
            fullWidth 
            variant="outlined" 
            value={currentUser.domain} 
            onChange={handleFormChange}
            disabled={isEditMode && !!currentUser.domain}
            helperText={isEditMode && !!currentUser.domain ? "Domain cannot be changed once set." : ""}
          />
          <TextField margin="dense" name="password" label={isEditMode ? "New Password (leave blank to keep)" : "Password"} type="password" fullWidth variant="outlined" value={currentUser.password} onChange={handleFormChange}/>
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel>Role</InputLabel>
            <Select name="role" value={currentUser.role} label="Role" onChange={handleFormChange}>
              <MenuItem value="intern">Intern</MenuItem>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">{isEditMode ? 'Save Changes' : 'Add User'}</Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirmation and Snackbar Dialogs */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        {/* ... same dialog content as before ... */}
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete "{userToDelete?.name}"? This is irreversible.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={bulkDeleteConfirmOpen} onClose={() => setBulkDeleteConfirmOpen(false)}>
        {/* ... same dialog content as before ... */}
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

      {/* NEW: Render the Snapshot Modal */}
      <UserSnapshotModal
        isOpen={snapshotModalOpen}
        onClose={() => setSnapshotModalOpen(false)}
        user={selectedUserForSnapshot}
      />
    </div>
  );
}

export default UserListPage;