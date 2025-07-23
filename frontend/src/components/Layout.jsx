// frontend/src/layouts/Layout.jsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Box className="app-layout">
            <Topbar isSidebarExpanded={isExpanded} /> {/* Pass state if topbar needs to adjust */}
            <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            
            {/* This div pushes the main content to the right to prevent overlap */}
            <div className={`content-pusher ${isExpanded ? 'expanded' : 'collapsed'}`}></div>

            <Box component="main" className="main-content-area">
                {/* A spacer for the fixed Topbar */}
                <Box sx={{ height: '64px' }} /> 
                <Box sx={{ p: 3 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};
export default Layout;