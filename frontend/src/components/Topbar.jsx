// frontend/src/layouts/Topbar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAuth } from '../context/AuthContext';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import '../styles/Topbar.css';

const tabItems = [
  // { label: 'Overview', path: '/overview' },
  { label: 'Home', path: '/dashboard' },
  // { label: 'Calendar', path: '/calendar' },
];

const Topbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleLogout = () => { handleClose(); logout(); navigate('/login'); };

    return (
        <div className="topbar">
            <div className="topbar-left">
                <span className="topbar-logo">AMS</span>
                <nav className="topbar-tabs">
                  {tabItems.map(tab => (
                    <NavLink
                      key={tab.label}
                      to={tab.path}
                      className={({ isActive }) => `topbar-tab${isActive ? ' active' : ''}`}
                    >
                      {tab.label}
                    </NavLink>
                  ))}
                </nav>
            </div>
            <div className="topbar-right">
                <IconButton><SearchIcon /></IconButton>
                <IconButton><NotificationsNoneIcon /></IconButton>
                <Tooltip title="Account">
                    <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main' }}>{user?.name?.charAt(0)}</Avatar>
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} sx={{ mt: '45px' }}>
                    <MenuItem onClick={handleClose}>Profile</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
            </div>
        </div>
    );
};
export default Topbar;