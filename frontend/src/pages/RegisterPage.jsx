import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import '../styles/RegisterPage.css'; // Adjust path as needed
import { Container, Box, Typography, TextField, Button, Alert } from '@mui/material';

function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const { name, email, password } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            await api.post('/auth/register', { name, email, password });
            setSuccess('Registration successful! Please log in.');
            // Redirect to login page after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed. Please try again.');
            console.error(err);
        }
    };

   return (
    <Box className="register-page-wrapper">
        <img
            src="/assets/images/19d16f35-a1b5-4822-b02c-dbb2a131038c.png"
            alt="Byline Logo"
            className="register-background-logo"
        />
        <Box className="register-content-wrapper">
            <Box className="register-card">
                <Typography component="h1" variant="h5" align="center" gutterBottom>
                    Create Account
                </Typography>
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
                    <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" value={name} onChange={handleChange} />
                    <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={handleChange} />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={handleChange} />

                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{success}</Alert>}

                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
                        Sign Up
                    </Button>

                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            Already have an account? Sign In
                        </Typography>
                    </Link>
                </Box>
            </Box>
        </Box>
    </Box>
);

}

export default RegisterPage;