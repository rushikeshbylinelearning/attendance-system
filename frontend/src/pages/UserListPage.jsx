import React, { useState, useEffect } from 'react';
import api, { addUser, deleteUser, updateUser } from '@/services/api';
import { socket } from '@/services/socket';
import '../styles/UserListPage.css';

import {
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Button
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

const initialFormState = {
  name: '', email: '', password: '', employeeId: '', seatNumber: '', role: 'employee',
};

function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(initialFormState);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    socket.connect();
    function onUserAdded(newUser) {
      setUsers(prevUsers => [newUser, ...prevUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setSnackbar({ open: true, message: `User ${newUser.name} added!`, severity: 'success' });
    }
    function onUserDeleted(deletedUserId) {
      setUsers(prevUsers => prevUsers.filter(user => user._id !== deletedUserId));
      setSnackbar({ open: true, message: 'User deleted successfully!', severity: 'warning' });
    }
    function onUserUpdated(updatedUser) {
      setUsers(prevUsers => prevUsers.map(user => user._id === updatedUser._id ? updatedUser : user));
      setSnackbar({ open: true, message: `User ${updatedUser.name}'s details updated!`, severity: 'info' });
    }
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
        setUsers(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setError('');
      } catch (err) {
        setError(err.response?.data?.msg || 'You do not have permission to view this page.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleOpenAddDialog = () => {
    setIsEditMode(false);
    setCurrentUser(initialFormState);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (user) => {
    setIsEditMode(true);
    setCurrentUser({ ...user, password: '' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => setDialogOpen(false);

  const handleFormChange = (e) => setCurrentUser({ ...currentUser, [e.target.name]: e.target.value });

  const handleSaveUser = async () => {
    try {
      if (isEditMode) {
        // --- CHANGE 1: Create a payload with all editable fields ---
        const { name, email, employeeId, seatNumber, role, password } = currentUser;
        const dataToUpdate = { name, email, employeeId, seatNumber, role };

        // Only include the password in the update if a new one has been typed
        if (password && password.trim() !== '') {
          dataToUpdate.password = password;
        }
        await updateUser(currentUser._id, dataToUpdate);
      } else {
        await addUser(currentUser);
      }
      handleCloseDialog();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.msg || 'An error occurred.', severity: 'error' });
    }
  };

  const handleOpenDeleteConfirm = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };
  
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete._id);
      handleCloseDeleteConfirm();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.msg || 'Failed to delete user.', severity: 'error' });
    }
  };

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  return (
    <div className="user-page-container">
      <div className="user-content-wrapper">
        <header className="user-list-header">
          <h1 className="user-list-title">User Management</h1>
          <button className="new-user-btn" onClick={handleOpenAddDialog}>
            <AddIcon />
            Add New User
          </button>
        </header>

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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td data-label="Name">{user.name}</td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Role">
                      <span className={`role-chip role-${user.role || 'default'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td data-label="Joined">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td data-label="Actions" className="actions-cell">
                      <button className="action-btn" onClick={() => handleOpenEditDialog(user)} title="Edit User">
                        <EditIcon fontSize="small" />
                      </button>
                      <button className="action-btn delete" onClick={() => handleOpenDeleteConfirm(user)} title="Delete User">
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

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {isEditMode ? `Update details for ${currentUser.name}.` : 'Please fill in the details for the new user.'}
          </DialogContentText>
          
          {/* --- CHANGE 2: Unified form for both Add and Edit modes --- */}
          <TextField autoFocus margin="dense" name="name" label="Full Name" type="text" fullWidth variant="outlined" value={currentUser.name} onChange={handleFormChange} />
          <TextField margin="dense" name="email" label="Email Address" type="email" fullWidth variant="outlined" value={currentUser.email} onChange={handleFormChange} />
          <TextField margin="dense" name="employeeId" label="Employee ID" type="text" fullWidth variant="outlined" value={currentUser.employeeId} onChange={handleFormChange} />
          <TextField margin="dense" name="seatNumber" label="Seat Number" type="text" fullWidth variant="outlined" value={currentUser.seatNumber} onChange={handleFormChange} />

          {/* Password field with smart label */}
          <TextField
            margin="dense"
            name="password"
            label={isEditMode ? "New Password (leave blank to keep current)" : "Password"}
            type="password"
            fullWidth
            variant="outlined"
            value={currentUser.password}
            onChange={handleFormChange}
          />
          
          <FormControl fullWidth margin="dense" variant="outlined">
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select labelId="role-select-label" name="role" value={currentUser.role} label="Role" onChange={handleFormChange}>
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="technician">Technician</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">{isEditMode ? 'Save Changes' : 'Add User'}</Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default UserListPage;