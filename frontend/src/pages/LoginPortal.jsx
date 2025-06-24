import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Paper, Stack } from '@mui/material';

function LoginPortal() {
    const navigate = useNavigate();

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={3} sx={{ marginTop: 8, padding: 4 }}>
                <Typography component="h1" variant="h4" align="center" gutterBottom>
                    Select Your Login Portal
                </Typography>
                <Stack spacing={2} sx={{ mt: 4 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        size="large"
                        onClick={() => navigate('/login/employee')}
                    >
                        Employee Portal
                    </Button>
                    <Button 
                        variant="outlined" 
                        color="secondary"
                        size="large"
                        onClick={() => navigate('/login/admin')}
                    >
                        Admin / Technician Portal
                    </Button>
                </Stack>
            </Paper>
        </Container>
    );
}

export default LoginPortal;