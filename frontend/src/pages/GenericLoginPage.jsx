import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';

// This component now takes a 'loginType' prop ('admin' or 'employee')
function GenericLoginPage({ loginType }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const pageTitle = loginType === 'admin' ? 'Admin & Technician Login' : 'Employee Login';
    const registerLink = loginType === 'admin' ? null : (
        <Link to="/register" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                Don't have an account? Sign Up
            </Typography>
        </Link>
    );

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // Pass the loginType to the backend API call
            const response = await api.post('/auth/login', { email, password, loginType });

            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/dashboard'); // Navigate to dashboard on successful login
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed. Please try again.');
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    {pageTitle}
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        Login
                    </Button>
                    {registerLink}
                </Box>
            </Box>
        </Container>
    );
}

export default GenericLoginPage;