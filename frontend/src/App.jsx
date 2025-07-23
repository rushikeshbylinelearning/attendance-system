// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import EmployeesPage from './pages/EmployeesPage';
import ShiftsPage from './pages/ShiftsPage';

// ** 1. IMPORT THE DATE PICKER PROVIDERS **
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Import Layout and Pages
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import EmployeeDashboardPage from './pages/EmployeeDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import EmployeeLogViewer from './pages/EmployeeLogViewer';
import LeavesPage from './pages/LeavesPage';
import AdminLeavesPage from './pages/AdminLeavesPage';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#dc004e' },
        background: { default: '#f4f6f8' },
    },
});

// This component intelligently routes to the correct dashboard
const DashboardRouter = () => {
    const { user } = useAuth();
    if (user.role === 'Admin' || user.role === 'HR') {
        return <AdminDashboardPage />;
    }
    return <EmployeeDashboardPage />;
};

function App() {
    return (
        // ** 2. WRAP THE ENTIRE APP WITH THE PROVIDER **
        // The LocalizationProvider MUST be outside the Router if you have
        // pickers on pages not managed by the router (though that's rare).
        // Placing it here is the safest option.
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Router>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            
                            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                                <Route path="/dashboard" element={<DashboardRouter />} />
                                <Route path="/admin" element={<AdminDashboardPage />} />
                                <Route path="/employee-logs" element={<EmployeeLogViewer />} />
                                <Route path="/employees" element={<EmployeesPage />} />
                                {/* Placeholder for a future page */}
                                <Route path="/leaves" element={<LeavesPage />} />
                                <Route path="/shifts" element={<ShiftsPage />} />
                                <Route path="/admin/leaves" element={<ProtectedRoute><AdminLeavesPage /></ProtectedRoute>} />
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
                    </AuthProvider>
                </Router>
            </ThemeProvider>
        </LocalizationProvider>
    );
}

export default App;