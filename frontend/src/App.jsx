// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PrivateRoute from './components/PrivateRoute'; 

// --- IMPORT ALL YOUR PAGES AND COMPONENTS ---
import Layout from '@/components/Layout';
import LoginUnified from './pages/LoginUnified';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import InventoryPage from '@/pages/InventoryPage';
import AllocationPage from '@/pages/AllocationPage';
import TicketListPage from '@/pages/TicketListPage';
import UserListPage from '@/pages/UserListPage';
import ManageComponentTypes from './pages/ManageComponentTypes';
import RoboticsInventoryPage from './pages/RoboticsInventoryPage';
import InquiryListPage from './pages/InquiryListPage';

// --- THIS IS THE FIX ---
// REMOVED: import MyAssetGridPage from '@/pages/MyAssetGridPage';
import MyAnalyticsPage from "@/pages/MyAnalyticsPage"; // This is the correct page to import

import { HRInventoryProvider } from './pages/hr/HRInventoryPage';
import HRDashboardPage from './pages/hr/HRDashboardPage';
import HRInventoryPage from './pages/hr/HRInventoryPage';

// The theme definition...
const theme = createTheme({ /* ... your theme styles ... */ });

// Assuming this is your main protection wrapper for the layout
const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// --- MAIN APP COMPONENT ---
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginUnified />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Protected Routes inside the Layout */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        {/* --- General Routes --- */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        <Route path="/robotics-inventory" element={<RoboticsInventoryPage />} />
                        
                        {/* --- CORRECTED AND SIMPLIFIED ROUTE --- */}
                        {/* It's already protected by the parent, so no extra PrivateRoute is needed */}
                        <Route path="/my-analytics" element={<MyAnalyticsPage />} />
                        
                        <Route path="/allocations" element={<AllocationPage />} /> 
                        <Route path="/tickets" element={<TicketListPage />} />
                        <Route path="/users" element={<UserListPage />} />
                        
                        {/* Ensure this route is also protected as needed */}
                        <Route path="/admin/manage-data" element={<ManageComponentTypes />} />
                        
                        <Route path="/inquiries" element={<InquiryListPage />} />
                        
                        {/* HR pages grouping route */}
                        <Route element={
                            <HRInventoryProvider>
                                <Outlet />
                            </HRInventoryProvider>
                        }>
                            <Route path="/hr" element={<HRDashboardPage />} />
                            <Route path="/hr/inventory" element={<HRInventoryPage />} />
                        </Route>

                        {/* Default route for logged-in users */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;