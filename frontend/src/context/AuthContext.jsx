// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyTokenAndFetchUser = async () => {
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const response = await axios.get('http://localhost:3001/api/auth/me');
                    setUser(response.data); // Set the full user object
                } catch (error) {
                    console.error("Session expired or token invalid", error);
                    // Token is invalid, clear it
                    setToken(null);
                    setUser(null);
                    sessionStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
        };
        verifyTokenAndFetchUser();
    }, [token]);

    const login = async (email, password) => {
        const response = await axios.post('http://localhost:3001/api/auth/login', { email, password });
        const { token, user } = response.data;
        sessionStorage.setItem('token', token);
        setToken(token); // This will trigger the useEffect above to fetch user data
        setUser(user); // Also set user immediately for faster UI update
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    const value = { user, token, login, logout, isAuthenticated: !!user };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);