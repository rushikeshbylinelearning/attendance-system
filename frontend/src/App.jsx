import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PrivateRoute from './components/PrivateRoute'; 

// --- IMPORT ALL YOUR PAGES AND COMPONENTS ---
import Layout from '@/components/Layout';
import LoginUnified from './pages/LoginUnified'; // Correct the path based on your project structure
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import InventoryPage from '@/pages/InventoryPage';
import AllocationPage from '@/pages/AllocationPage';
import TicketListPage from '@/pages/TicketListPage';
import UserListPage from '@/pages/UserListPage';
import MyAssetGridPage from '@/pages/MyAssetGridPage';
import ManageComponentTypes from './pages/ManageComponentTypes';
// ✅ ADDED: Import for the new Robotics Inventory page
// import Employees from './pages/hr/Employees';
import RoboticsInventoryPage from './pages/RoboticsInventoryPage';
import InquiryListPage from './pages/InquiryListPage';
import { HRDashboardPage, HRInventoryPage } from './pages/hr';

// The theme definition...
const theme = createTheme({ /* ... your theme styles ... */ });

// The ProtectedRoute component...
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
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        {/* ✅ ADDED: Route for the new Robotics Inventory page */}
                        <Route path="/robotics-inventory" element={<RoboticsInventoryPage />} />
                        <Route path="/my-assets" element={<MyAssetGridPage />} /> 
                        <Route path="/allocations" element={<AllocationPage />} /> 
                        <Route path="/tickets" element={<TicketListPage />} />
                        <Route path="/users" element={<UserListPage />} />
                        <Route path="/admin/manage-data" element={<PrivateRoute><ManageComponentTypes /></PrivateRoute>} />
                        <Route path="/inquiries" element={<InquiryListPage />} />
                        <Route path="/hr" element={<HRDashboardPage />} />
                        <Route path="/hr/inventory" element={<HRInventoryPage />} />
                        {/* Default route for logged-in users */}
                        
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;