import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PageLayout from '@/components/PageLayout';
import { Box, Paper, Typography, CircularProgress, Alert, Grid, Divider } from '@mui/material';
import ComputerIcon from '@mui/icons-material/Computer';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import PowerIcon from '@mui/icons-material/Power';
import DevicesIcon from '@mui/icons-material/Devices';

// A reusable component for displaying a single assigned asset
const AssetCard = ({ icon, make, serial }) => (
    <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        {icon}
        <Box ml={2}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>{make || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary">S/N: {serial || 'N/A'}</Typography>
        </Box>
    </Paper>
);

function MyAssetsPage() {
    const [myAllocation, setMyAllocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyAllocation = async () => {
            setLoading(true);
            try {
                const response = await api.get('/api/allocations/my');
                setMyAllocation(response.data);
            } catch (err) {
                // The 404 error from the API is expected if user has no allocations
                if (err.response && err.response.status === 404) {
                    setError('You do not have any assets currently assigned to you.');
                } else {
                    setError('Could not fetch your asset details.');
                }
                console.error("Failed to fetch my allocation:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyAllocation();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box>;

    return (
        <PageLayout title="My Assigned Assets">
            {error && !myAllocation ? (
                <Alert severity="info" sx={{ mt: 2 }}>{error}</Alert>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                        <AssetCard
                            icon={<ComputerIcon color="primary" sx={{ fontSize: 40 }} />}
                            make={myAllocation?.['Monitor make']}
                            serial={myAllocation?.['Monitor Serial No']}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <AssetCard
                            icon={<KeyboardIcon color="action" sx={{ fontSize: 40 }} />}
                            make={myAllocation?.['Keyboard make']}
                            serial={myAllocation?.['KB Serial No']}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <AssetCard
                            icon={<MouseIcon color="action" sx={{ fontSize: 40 }} />}
                            make={myAllocation?.['Mouse make']}
                            serial={myAllocation?.['Mouse Serial No']}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <AssetCard
                            icon={<PowerIcon color="warning" sx={{ fontSize: 40 }} />}
                            make={myAllocation?.['UPS make']}
                            serial={myAllocation?.['UPS Serial No']}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <AssetCard
                            icon={<DevicesIcon color="success" sx={{ fontSize: 40 }} />}
                            make="CPU"
                            serial={myAllocation?.['CPU Serial No']}
                        />
                    </Grid>
                    {/* Add more cards for other assets like Pen Tab, Headphones, etc. */}
                </Grid>
            )}
        </PageLayout>
    );
}

export default MyAssetsPage;