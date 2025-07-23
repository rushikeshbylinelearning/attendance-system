// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Alert, Avatar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import '../styles/Page.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password);
            console.log('[LoginPage] login result:', result);
            navigate('/dashboard');
        } catch (err) {
            console.error('[LoginPage] Login page caught an error:', err, err?.response);
            window.alert('Login failed: ' + (err?.response?.data?.error || err?.message || err));
            setError(err?.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', background: '#f4f7fb' }}>
            <div className="card" style={{ minWidth: 340, maxWidth: 400, width: '100%', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar style={{ marginBottom: 16, background: '#2563eb' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5" style={{ marginBottom: 16 }}>
                    Sign in
                </Typography>
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    {error && <Alert severity="error" style={{ width: '100%', marginBottom: 16 }}>{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address or Employee Code"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        style={{ marginTop: 24, marginBottom: 8 }}
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;