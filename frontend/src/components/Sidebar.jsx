// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['Employee', 'Intern', 'HR', 'Admin'] },
    { text: 'View Logs', icon: <FindInPageIcon />, path: '/employee-logs', roles: ['HR', 'Admin'] },
    { text: 'Employees', icon: <PeopleIcon />, path: '/employees', roles: ['HR', 'Admin'] },
    { text: 'Shift Management', icon: <TimelapseIcon />, path: '/shifts', roles: ['Admin'] },
    { text: 'Leave Management', icon: <EventNoteIcon />, path: '/leaves', roles: ['Employee', 'Intern', 'HR', 'Admin'] },
    { text: 'Reports', icon: <AdminPanelSettingsIcon />, path: '/admin', roles: ['Admin'] },
];

const Sidebar = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false); // Default to collapsed (mini) sidebar
    const toggleSidebar = () => setOpen((prev) => !prev);

    return (
        <nav className={`sidebar${open ? ' open' : ' collapsed'}`}> 
            <div className="sidebar-toggle" onClick={toggleSidebar}>
                {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </div>
            <div className="sidebar-list">
                {menuItems.filter(item => item.roles.includes(user.role)).map((item) => (
                    <div className="sidebar-list-item" key={item.text}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.text}</span>
                        </NavLink>
                    </div>
                ))}
            </div>
        </nav>
    );
};

export default Sidebar;