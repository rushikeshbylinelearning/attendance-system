import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// --- IMPORT ALL YOUR PAGES AND COMPONENTS ---
import Layout from '@/components/Layout';
import GenericLoginPage from '@/pages/GenericLoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import InventoryPage from '@/pages/InventoryPage';
import AllocationPage from '@/pages/AllocationPage'; // <-- Make sure this is imported
import TicketListPage from '@/pages/TicketListPage';
import UserListPage from '@/pages/UserListPage';
import LoginPortal from '@/pages/LoginPortal';

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
                    <Route path="/login" element={<LoginPortal />} />
                    <Route path="/login/admin" element={<GenericLoginPage loginType="admin" />} />
                    <Route path="/login/employee" element={<GenericLoginPage loginType="employee" />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* Protected Routes inside the Layout */}
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/inventory" element={<InventoryPage />} />
                        
                        {/* --- THE FIX IS HERE --- */}
                        <Route path="/allocations" element={<AllocationPage />} /> 

                        <Route path="/tickets" element={<TicketListPage />} />
                        <Route path="/users" element={<UserListPage />} />
                        
                        {/* Default route for logged-in users */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;