// frontend/src/components/MainLayout.jsx

import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { Box, AppBar as MuiAppBar, Toolbar, Typography, IconButton, Drawer, CssBaseline, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/MainLayout.css'; // Import our new CSS file

const drawerWidth = 240;

// Styled component for the main content area to handle the "push" effect
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
    backgroundColor: '#f4f6f8',
    minHeight: '100vh'
  }),
);

// Styled component for the AppBar to handle resizing when the sidebar opens
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));


const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [anchorEl, setAnchorEl] = useState(null);

    const handleMenu = (event) => { setAnchorEl(event.currentTarget); };
    const handleClose = () => { setAnchorEl(null); };

    const handleLogout = () => {
        handleClose();
        logout();
        navigate('/login');
    };
    
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

    return (
        <>
            <CssBaseline />
            <Sidebar />
            <Box sx={{ ml: 0 }}>
                <AppBar position="fixed">
                    <Toolbar>
                        {/* BRANDING: Home icon and AMS title */}
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                            <IconButton component={Link} to="/" color="inherit" edge="start">
                                <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: '1rem' }}>AMS</Avatar>
                            </IconButton>
                            <Typography variant="h6" noWrap component="div" sx={{ ml: 2, display: {xs: 'none', sm: 'block'} }}>
                                Attendance Management System
                            </Typography>
                        </Box>
                        {/* PROFILE MENU */}
                        <Box sx={{ flexShrink: 0 }}>
                            <Tooltip title="Account settings">
                                <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                                    <Avatar sx={{ bgcolor: 'primary.dark' }}>{userInitial}</Avatar>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorEl}
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                keepMounted
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                sx={{ mt: '45px' }}
                            >
                                <MenuItem onClick={handleClose}>Profile</MenuItem>
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </Menu>
                        </Box>
                    </Toolbar>
                </AppBar>
                <Box sx={{ pt: 8 }}>
                    <Outlet />
                </Box>
            </Box>
        </>
    );
};

export default MainLayout;