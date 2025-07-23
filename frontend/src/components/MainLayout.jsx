// frontend/src/components/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import '../styles/MainLayout.css';

const MainLayout = () => {
    return (
        <div className="main-layout">
            <Sidebar />
            <Topbar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;