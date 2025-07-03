import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// This component checks for a token in localStorage.
// You can adapt this to your auth state management (e.g., Context, Redux).
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // Or however you store your auth token
  const location = useLocation();

  if (!token) {
    // If the user is not authenticated, redirect them to the login page.
    // We save the location they were trying to go to so we can redirect them back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is authenticated, render the component they were trying to access.
  return children;
};

export default ProtectedRoute;