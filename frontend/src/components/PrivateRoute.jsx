import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    // This logic checks if the user data exists in session storage.
    // I am using this method because I saw it in your DashboardPage.jsx.
    // This ensures it's consistent with the rest of your app's auth logic.
    const isAuthenticated = !!sessionStorage.getItem('user');

    // If the user is authenticated, we render the child component they are trying to access.
    // 'children' here will be <DashboardPage />, <InventoryPage />, etc.
    if (isAuthenticated) {
        return children;
    }

    // If the user is NOT authenticated, we redirect them to the login page.
    // The 'replace' prop prevents the user from clicking the "back" button
    // to get back to the protected route they were just kicked out of.
    return <Navigate to="/login" replace />;
};

export default PrivateRoute;