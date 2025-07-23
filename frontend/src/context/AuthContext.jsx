// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { CircularProgress } from '@mui/material';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const initializeAuth = useCallback(async () => {
        const token = sessionStorage.getItem('token');
        console.log('[AuthContext] initializeAuth: token from sessionStorage:', token);
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log('[AuthContext] Decoded token:', decoded);
                if (decoded.exp * 1000 > Date.now()) {
                    const response = await api.get('/auth/me');
                    console.log('[AuthContext] /auth/me response:', response);
                    setUser(response.data);
                    setIsAuthenticated(true);
                } else {
                    sessionStorage.removeItem('token');
                    console.warn('[AuthContext] Token expired, removed from sessionStorage');
                }
            } catch (error) {
                console.error('[AuthContext] Auth initialization error:', error);
                window.alert('Auth initialization error: ' + (error?.message || error));
                sessionStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log('[AuthContext] login API response:', response);
            const { token, user: userData } = response.data;
            sessionStorage.setItem('token', token);
            setUser(userData);
            setIsAuthenticated(true);
            return userData;
        } catch (error) {
            console.error('[AuthContext] login error:', error, error?.response);
            window.alert('Login error: ' + (error?.response?.data?.error || error?.message || error));
            throw error;
        }
    };

    const logout = () => {
        // FIX: Remove from sessionStorage
        sessionStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = { user, isAuthenticated, loading, login, logout };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </div>
        );
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);