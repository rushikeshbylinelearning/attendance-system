// frontend/src/components/Sidebar.jsx

import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['Employee', 'Intern', 'HR', 'Admin'] },
    { text: 'View Logs', icon: <FindInPageIcon />, path: '/employee-logs', roles: ['HR', 'Admin'] },
    { text: 'Leave Management', icon: <EventNoteIcon />, path: '/leaves', roles: ['Employee', 'Intern', 'HR', 'Admin'] },
    { text: 'Employees', icon: <PeopleIcon />, path: '/employees', roles: ['HR', 'Admin'] },
    { text: 'Admin Panel', icon: <AdminPanelSettingsIcon />, path: '/admin', roles: ['Admin'] },
];

const Sidebar = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const handleToggle = () => setOpen((prev) => !prev);
    const activeLinkStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        borderLeft: '4px solid #1976d2',
    };
    return (
        <div className={`sidebar${open ? ' open' : ''}`}> 
            <div className="sidebar-toggle">
                <IconButton onClick={handleToggle} size="large">
                    {open ? <ChevronLeftIcon /> : <MenuIcon />}
                </IconButton>
            </div>
            <Divider />
            <List>
                {menuItems
                    .filter(item => item.roles.includes(user.role))
                    .map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                style={({ isActive }) => isActive ? activeLinkStyle : undefined}
                                className="sidebar-link"
                            >
                                <ListItemIcon className="sidebar-icon">{item.icon}</ListItemIcon>
                                {open && <ListItemText primary={item.text} className="sidebar-label" />}
                            </ListItemButton>
                        </ListItem>
                    ))}
            </List>
        </div>
    );
};

export default Sidebar;